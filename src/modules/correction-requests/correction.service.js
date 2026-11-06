const ApiError = require('../../utils/ApiError');
const withTransaction = require('../../utils/withTransaction');
const { ALLOWED_CORRECTION_FIELDS } = require('../../constants/allowed-fields');
const { logAudit } = require('../audit/audit.service');
const correctionRepo = require('./correction.repository');

/**
 * Map a DB row → response DTO. Never leak internal-only columns.
 */
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

/**
 * Explicit field-name → record-column mapping.
 * NEVER use dynamic access like `record[fieldName]` — a spoofed field name
 * could then accidentally read `password_hash` or other columns.
 */
function getRecordFieldValue(record, fieldName) {
  const map = {
    full_name: record.full_name,
  };
  return map[fieldName];
}

async function createRequest(user, recordRef, payload) {
  const { changes, reason } = payload;
  const change = changes[0];

  // ── Defense in depth: even though Zod validated, re-check allowlist ────
  if (!ALLOWED_CORRECTION_FIELDS.includes(change.fieldName)) {
    throw new ApiError(
      400,
      'UNSUPPORTED_FIELD',
      `Field '${change.fieldName}' is not supported.`
    );
  }

  return withTransaction(async (conn) => {
    // ── 1. Lock record row (serializes concurrent creates for this record) ──
    const record = await correctionRepo.findRecordByReferenceForUpdate(conn, recordRef);

    if (!record) {
      throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
    }

    // ── 2. Ownership ─────────────────────────────────────────────────────────
    if (record.citizen_user_id !== user.id) {
      throw new ApiError(403, 'NOT_RECORD_OWNER', 'This record does not belong to you.');
    }

    // ── 3. No-op detection ──────────────────────────────────────────────────
    const currentValue = getRecordFieldValue(record, change.fieldName);

    if (change.proposedValue === currentValue) {
      throw new ApiError(
        400,
        'NO_CHANGE_REQUESTED',
        'The proposed value is identical to the current value.'
      );
    }

    // ── 4. Duplicate pending request (same record + field) ───────────────────
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

    // ── 5. Insert request — old_value & expected_version from DB ─────────────
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

    // ── 6. Audit log — same transaction, same connection ─────────────────────
    await logAudit(conn, {
      actorUserId: user.id,
      action: 'REQUEST_SUBMITTED',
      entityType: 'correction_request',
      entityId: requestId,
      metadata: {
        recordId: record.id,
        fieldName: change.fieldName,
        // NOTE: no names, no proposed values — pointers only
      },
    });

    // ── 7. Return the inserted row (fetched inside the tx) ───────────────────
    const request = await correctionRepo.findRequestById(conn, requestId);
    return sanitize(request);
  });
}

module.exports = { createRequest };