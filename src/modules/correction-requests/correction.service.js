const ApiError = require('../../utils/ApiError');
const withTransaction = require('../../utils/withTransaction');
const { ALLOWED_CORRECTION_FIELDS } = require('../../constants/allowed-fields');
const { logAudit } = require('../audit/audit.service');
const correctionRepo = require('./correction.repository');

// ════════════════════════════════════════════════════════════════
// Response shaping
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
// M2.4, M2.5 — Citizen flows
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
// M3.1, M3.2 — Officer read
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
// M3.4, M3.5 — Decision (approve + reject)
// ════════════════════════════════════════════════════════════════

/**
 * Shared preflight inside the transaction:
 *  - lock record (lock #1)
 *  - lock request (lock #2)
 *  - verify PENDING / dept / version / field / old_value (approve only for last two)
 *
 * Lock order is ALWAYS record → request to prevent deadlock.
 */
async function _lockAndValidate(officer, requestId) {
  // We need a fresh connection each time. The caller wraps us in withTransaction,
  // and we receive `conn` explicitly — see callers below.
  throw new Error('_lockAndValidate must be called from within withTransaction');
}

async function _validateLockedEntities(conn, officer, requestId) {
  // Step 1: non-locking read of citizen_record_id
  const recordId = await correctionRepo.findRequestRecordId(conn, requestId);
  if (!recordId) throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');

  // Step 2: lock record (lock #1)
  const record = await correctionRepo.lockRecordById(conn, recordId);
  if (!record) {
    throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
  }

  // Step 3: lock request (lock #2)
  const request = await correctionRepo.lockRequestById(conn, requestId);
  if (!request) {
    // Should not happen because we just read it, but defensive.
    throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
  }

  // Step 4: status must be PENDING
  if (request.status !== 'PENDING') {
    throw new ApiError(
      409,
      'REQUEST_ALREADY_PROCESSED',
      'This correction request has already been finalized.'
    );
  }

  // Step 5: department authorization
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

    // Step 6: version snapshot must match current record version
    if (request.expected_record_version !== record.record_version) {
      throw new ApiError(
        409,
        'RECORD_STATE_CONFLICT',
        'The record has been modified since this request was submitted.'
      );
    }

    // Step 7: field allowlist + old_value must match current value
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

    // Step 8: update record + version bump
    const updated = await correctionRepo.updateRecordFullName(
      conn,
      record.id,
      request.proposed_value
    );
    if (!updated) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to update record.');
    }

    // Step 9: mark request APPROVED
    await correctionRepo.markRequestApproved(conn, requestId, officer.id);

    // Step 10: audit — pointers only
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

    // Return the freshly finalized request (inside the tx to see updated row)
    const finalRow = await correctionRepo.findRequestDetailByIdTx(conn, requestId);
    return sanitizeForOfficer(finalRow);
  });
}

async function rejectRequest(officer, requestId, rejectionReason) {
  return withTransaction(async (conn) => {
    const { request } = await _validateLockedEntities(conn, officer, requestId);

    // Steps 6 & 7 are intentionally SKIPPED for rejection.
    // A rejected request does NOT modify the record, so a version/old-value
    // conflict is not a reason to block the decision — the officer is
    // finalizing the application, not applying it.

    // Step 9 (reject branch): mark request REJECTED with reason
    await correctionRepo.markRequestRejected(
      conn,
      requestId,
      officer.id,
      rejectionReason
    );

    // Step 10: audit — pointers only
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
  // Citizen
  createRequest,
  listMyRequests,
  getMyRequestById,
  // Officer read
  listForOfficer,
  getRequestForOfficer,
  // Officer decision
  decideRequest,
};