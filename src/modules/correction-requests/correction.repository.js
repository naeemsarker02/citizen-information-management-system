const { pool } = require('../../config/database');

/**
 * Lock a citizen record by reference. Used in create flow so concurrent
 * create attempts for the same record serialize on this row lock.
 *
 * MUST be called inside an active transaction (pass `conn`).
 */
async function findRecordByReferenceForUpdate(conn, recordRef) {
  const [rows] = await conn.query(
    `SELECT id, citizen_user_id, department_id, record_type, record_reference,
            full_name, date_of_birth, address, record_version
     FROM citizen_records
     WHERE record_reference = ?
     FOR UPDATE`,
    [recordRef]
  );
  return rows[0] || null;
}

/**
 * Duplicate check — is there already a PENDING request for this
 * (record, field) pair? Relies on the record row lock being held.
 */
async function findPendingRequestForField(conn, recordId, fieldName) {
  const [rows] = await conn.query(
    `SELECT id
     FROM correction_requests
     WHERE citizen_record_id = ?
       AND field_name = ?
       AND status = 'PENDING'
     LIMIT 1`,
    [recordId, fieldName]
  );
  return rows[0] || null;
}

/**
 * Insert a new correction request with status = PENDING.
 * old_value and expected_record_version MUST come from the locked record.
 */
async function insertRequest(conn, data) {
  const [result] = await conn.query(
    `INSERT INTO correction_requests
       (citizen_user_id, citizen_record_id, department_id,
        field_name, old_value, proposed_value, reason,
        expected_record_version, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      data.citizenUserId,
      data.citizenRecordId,
      data.departmentId,
      data.fieldName,
      data.oldValue,
      data.proposedValue,
      data.reason,
      data.expectedRecordVersion,
    ]
  );
  return result.insertId;
}

/**
 * Fetch a freshly inserted request (same transaction) so we can return it.
 */
async function findRequestById(conn, requestId) {
  const [rows] = await conn.query(
    `SELECT id, citizen_user_id, citizen_record_id, department_id,
            field_name, old_value, proposed_value, reason,
            expected_record_version, status,
            reviewed_by, reviewed_at, rejection_reason,
            submitted_at, updated_at
     FROM correction_requests
     WHERE id = ?
     LIMIT 1`,
    [requestId]
  );
  return rows[0] || null;
}

module.exports = {
  findRecordByReferenceForUpdate,
  findPendingRequestForField,
  insertRequest,
  findRequestById,
};