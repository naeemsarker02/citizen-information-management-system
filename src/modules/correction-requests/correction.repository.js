const { pool } = require('../../config/database');

// ════════════════════════════════════════════════════════════════
// Record + request access (M2.4 transactional flow)
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
// Citizen tracking (M2.5)
// ════════════════════════════════════════════════════════════════

async function findByCitizenId(userId) {
  const [rows] = await pool.query(
    `SELECT id, citizen_user_id, citizen_record_id, department_id,
            field_name, old_value, proposed_value, reason,
            expected_record_version, status,
            reviewed_by, reviewed_at, rejection_reason,
            submitted_at, updated_at
     FROM correction_requests
     WHERE citizen_user_id = ?
     ORDER BY submitted_at DESC, id DESC`,
    [userId]
  );
  return rows;
}

async function findByIdGlobal(requestId) {
  const [rows] = await pool.query(
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

// ════════════════════════════════════════════════════════════════
// Officer views (M3.1, M3.2) — join with citizen + record for review context
// ════════════════════════════════════════════════════════════════

/**
 * Officer list: department-scoped, optional status filter.
 * Uses req.user.departmentId — NOT a client-supplied department.
 */
async function findByDepartment({ departmentId, status }) {
  const conditions = ['cr.department_id = ?'];
  const params = [departmentId];

  if (status) {
    conditions.push('cr.status = ?');
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT cr.id, cr.citizen_user_id, cr.citizen_record_id, cr.department_id,
            cr.field_name, cr.old_value, cr.proposed_value, cr.reason,
            cr.expected_record_version, cr.status,
            cr.reviewed_by, cr.reviewed_at, cr.rejection_reason,
            cr.submitted_at, cr.updated_at,
            u.name  AS citizen_name,
            u.email AS citizen_email,
            rec.record_reference, rec.record_type,
            rec.full_name      AS record_current_full_name,
            rec.record_version AS record_current_version,
            reviewer.name      AS reviewer_name
     FROM correction_requests cr
     JOIN users u           ON u.id = cr.citizen_user_id
     JOIN citizen_records rec ON rec.id = cr.citizen_record_id
     LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY cr.submitted_at DESC, cr.id DESC`,
    params
  );
  return rows;
}

/**
 * Officer detail: fetch by ID without department filter — so the service
 * can distinguish "not found" (404) from "wrong department" (403).
 *
 * Accepts either `pool` or a transaction `conn` as executor, so the same
 * shape is reusable inside M3.4 / M3.5 transactions.
 */
async function _fetchDetail(executor, requestId) {
  const [rows] = await executor.query(
    `SELECT cr.id, cr.citizen_user_id, cr.citizen_record_id, cr.department_id,
            cr.field_name, cr.old_value, cr.proposed_value, cr.reason,
            cr.expected_record_version, cr.status,
            cr.reviewed_by, cr.reviewed_at, cr.rejection_reason,
            cr.submitted_at, cr.updated_at,
            u.name  AS citizen_name,
            u.email AS citizen_email,
            rec.record_reference, rec.record_type,
            rec.full_name      AS record_current_full_name,
            rec.record_version AS record_current_version,
            reviewer.name      AS reviewer_name
     FROM correction_requests cr
     JOIN users u           ON u.id = cr.citizen_user_id
     JOIN citizen_records rec ON rec.id = cr.citizen_record_id
     LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by
     WHERE cr.id = ?
     LIMIT 1`,
    [requestId]
  );
  return rows[0] || null;
}

async function findRequestDetailById(requestId) {
  return _fetchDetail(pool, requestId);
}

async function findRequestDetailByIdTx(conn, requestId) {
  return _fetchDetail(conn, requestId);
}

module.exports = {
  // M2.4 transactional
  findRecordByReferenceForUpdate,
  findPendingRequestForField,
  insertRequest,
  // M2.5 citizen tracking
  findByCitizenId,
  findByIdGlobal,
  // M3.1, M3.2 officer views
  findByDepartment,
  findRequestDetailById,
  findRequestDetailByIdTx,
};