const ApiError = require('../../utils/ApiError');
const withTransaction = require('../../utils/withTransaction');
const { ALLOWED_CORRECTION_FIELDS } = require('../../constants/allowed-fields');
const { logAudit } = require('../audit/audit.service');
const correctionRepo = require('./correction.repository');

function sanitize(request) {
  return {
    id: request.id,
    recordId: request.citizen_record_id,
    departmentId: request.department_id,
    fieldName: request.field_name,
    oldValue: request.old_value,
    proposedValue: request.proposed_value,
    reason: request.reason,
    expectedRecordVersion: request.expected_record_version,
    status: request.status,
    reviewedBy: request.reviewed_by,
    reviewedAt: request.reviewed_at,
    rejectionReason: request.rejection_reason,
    submittedAt: request.submitted_at,
    updatedAt: request.updated_at,
  };
}

function sanitizeForOfficer(row) {
  const review = row.reviewed_by
    ? {
        reviewerId: row.reviewed_by,
        reviewerName: row.reviewer_name,
        reviewedAt: row.reviewed_at,
        rejectionReason: row.rejection_reason,
      }
    : null;

  return {
    id: row.id,
    citizen: {
      id: row.citizen_user_id,
      name: row.citizen_name,
      email: row.citizen_email,
    },
    record: {
      id: row.citizen_record_id,
      reference: row.record_reference,
      type: row.record_type,
      currentFullName: row.record_current_full_name,
      currentVersion: row.record_current_version,
    },
    departmentId: row.department_id,
    fieldName: row.field_name,
    oldValue: row.old_value,
    proposedValue: row.proposed_value,
    reason: row.reason,
    expectedRecordVersion: row.expected_record_version,
    status: row.status,
    review,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

function getRecordFieldValue(record, fieldName) {
  const map = { full_name: record.full_name };
  return map[fieldName];
}

async function createRequest(user, recordRef, payload) {
  const { changes, reason } = payload;
  const change = changes[0];

  if (!ALLOWED_CORRECTION_FIELDS.includes(change.fieldName)) {
    throw new ApiError(400, 'UNSUPPORTED_FIELD', `Field '${change.fieldName}' is not supported.`);
  }

  return withTransaction(async (conn) => {
    const record = await correctionRepo.findRecordByReferenceForUpdate(conn, recordRef);

    if (!record) throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
    if (record.citizen_user_id !== user.id) {
      throw new ApiError(403, 'NOT_RECORD_OWNER', 'This record does not belong to you.');
    }

    const currentValue = getRecordFieldValue(record, change.fieldName);
    if (change.proposedValue === currentValue) {
      throw new ApiError(
        400,
        'NO_CHANGE_REQUESTED',
        'The proposed value is identical to the current value.'
      );
    }

    const existing = await correctionRepo.findPendingRequestForField(
      conn,
      record.id,
      change.fieldName
    );
    if (existing) {
      throw new ApiError(
        409,
        'DUPLICATE_PENDING_REQUEST',
        'A pending correction request already exists for this field.'
      );
    }

    const requestId = await correctionRepo.insertRequest(conn, {
      citizenUserId: user.id,
      citizenRecordId: record.id,
      departmentId: record.department_id,
      fieldName: change.fieldName,
      oldValue: currentValue,
      proposedValue: change.proposedValue,
      reason,
      expectedRecordVersion: record.record_version,
    });

    await logAudit(conn, {
      actorUserId: user.id,
      action: 'REQUEST_SUBMITTED',
      entityType: 'correction_request',
      entityId: requestId,
      metadata: { recordId: record.id, fieldName: change.fieldName },
    });

    const final = await correctionRepo.findRequestDetailByIdTx(conn, requestId);
    return sanitize(final);
  });
}

async function listMyRequests(user) {
  const rows = await correctionRepo.findByCitizenId(user.id);
  return rows.map(sanitize);
}

async function getMyRequestById(user, requestId) {
  const request = await correctionRepo.findByIdGlobal(requestId);
  if (!request) throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
  if (request.citizen_user_id !== user.id) {
    throw new ApiError(403, 'NOT_REQUEST_OWNER', 'This request does not belong to you.');
  }
  return sanitize(request);
}

async function listForOfficer(officer, filters) {
  const rows = await correctionRepo.findByDepartment({
    departmentId: officer.departmentId,
    status: filters.status,
  });
  return rows.map(sanitizeForOfficer);
}

async function getRequestForOfficer(officer, requestId) {
  const row = await correctionRepo.findRequestDetailById(requestId);
  if (!row) throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
  if (row.department_id !== officer.departmentId) {
    throw new ApiError(403, 'WRONG_DEPARTMENT', 'This request belongs to another department.');
  }
  return sanitizeForOfficer(row);
}

/**
 * Lock order is always record -> request to prevent deadlock.
 */
async function _lockAndValidate(officer, requestId) {
  throw new Error('_lockAndValidate must be called from within withTransaction');
}

async function _validateLockedEntities(conn, officer, requestId) {
  const recordId = await correctionRepo.findRequestRecordId(conn, requestId);
  if (!recordId) throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');

  const record = await correctionRepo.lockRecordById(conn, recordId);
  if (!record) {
    throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
  }

  const request = await correctionRepo.lockRequestById(conn, requestId);
  if (!request) {
    throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(
      409,
      'REQUEST_ALREADY_PROCESSED',
      'This correction request has already been finalized.'
    );
  }

  if (request.department_id !== officer.departmentId) {
    throw new ApiError(
      403,
      'WRONG_DEPARTMENT',
      'This request belongs to another department.'
    );
  }

  return { record, request };
}

async function approveRequest(officer, requestId) {
  return withTransaction(async (conn) => {
    const { record, request } = await _validateLockedEntities(conn, officer, requestId);

    if (request.expected_record_version !== record.record_version) {
      throw new ApiError(
        409,
        'RECORD_STATE_CONFLICT',
        'The record has been modified since this request was submitted.'
      );
    }

    if (!ALLOWED_CORRECTION_FIELDS.includes(request.field_name)) {
      throw new ApiError(
        400,
        'UNSUPPORTED_FIELD',
        `Field '${request.field_name}' is not supported.`
      );
    }
    const currentValue = getRecordFieldValue(record, request.field_name);
    if (currentValue !== request.old_value) {
      throw new ApiError(
        409,
        'RECORD_STATE_CONFLICT',
        'The record value has changed since this request was submitted.'
      );
    }

    const updated = await correctionRepo.updateRecordFullName(
      conn,
      record.id,
      request.proposed_value
    );
    if (!updated) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to update record.');
    }

    await correctionRepo.markRequestApproved(conn, requestId, officer.id);

    await logAudit(conn, {
      actorUserId: officer.id,
      action: 'REQUEST_APPROVED',
      entityType: 'correction_request',
      entityId: requestId,
      metadata: {
        recordId: record.id,
        prevVersion: record.record_version,
        newVersion: record.record_version + 1,
      },
    });

    const finalRow = await correctionRepo.findRequestDetailByIdTx(conn, requestId);
    return sanitizeForOfficer(finalRow);
  });
}

async function rejectRequest(officer, requestId, rejectionReason) {
  return withTransaction(async (conn) => {
    const { request } = await _validateLockedEntities(conn, officer, requestId);

    // A rejected request does NOT modify the record, so a version/old-value
    // conflict is not a reason to block the decision — the officer is
    // finalizing the application, not applying it.

    await correctionRepo.markRequestRejected(
      conn,
      requestId,
      officer.id,
      rejectionReason
    );

    await logAudit(conn, {
      actorUserId: officer.id,
      action: 'REQUEST_REJECTED',
      entityType: 'correction_request',
      entityId: requestId,
      metadata: { recordId: request.citizen_record_id },
    });

    const finalRow = await correctionRepo.findRequestDetailByIdTx(conn, requestId);
    return sanitizeForOfficer(finalRow);
  });
}

async function decideRequest(officer, requestId, payload) {
  if (payload.decision === 'APPROVED') {
    return approveRequest(officer, requestId);
  }
  return rejectRequest(officer, requestId, payload.reason);
}

module.exports = {
  createRequest,
  listMyRequests,
  getMyRequestById,
  listForOfficer,
  getRequestForOfficer,
  decideRequest,
};