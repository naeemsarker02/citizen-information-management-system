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

function getRecordFieldValue(record, fieldName) {
  const map = {
    full_name: record.full_name,
  };
  return map[fieldName];
}

async function createRequest(user, recordRef, payload) {
  const { changes, reason } = payload;
  const change = changes[0];

  if (!ALLOWED_CORRECTION_FIELDS.includes(change.fieldName)) {
    throw new ApiError(
      400,
      'UNSUPPORTED_FIELD',
      `Field '${change.fieldName}' is not supported.`
    );
  }

  return withTransaction(async (conn) => {
    const record = await correctionRepo.findRecordByReferenceForUpdate(conn, recordRef);

    if (!record) {
      throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
    }

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
      metadata: {
        recordId: record.id,
        fieldName: change.fieldName,
      },
    });

    const request = await correctionRepo.findRequestById(conn, requestId);
    return sanitize(request);
  });
}

// ── M2.5: Citizen tracking ───────────────────────────────────

async function listMyRequests(user) {
  const rows = await correctionRepo.findByCitizenId(user.id);
  return rows.map(sanitize);
}

async function getMyRequestById(user, requestId) {
  const request = await correctionRepo.findByIdGlobal(requestId);

  if (!request) {
    throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
  }

  // ⭐ Explicit ownership check — distinguishes "not found" (404) from
  // "exists but not yours" (403), per Context.md §12 error catalog.
  if (request.citizen_user_id !== user.id) {
    throw new ApiError(403, 'NOT_REQUEST_OWNER', 'This request does not belong to you.');
  }

  return sanitize(request);
}

module.exports = { createRequest, listMyRequests, getMyRequestById };