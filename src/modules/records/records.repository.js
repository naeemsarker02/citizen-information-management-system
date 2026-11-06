const { pool } = require('../../config/database');

async function findByCitizenId(userId) {
  const [rows] = await pool.query(
    `SELECT id, citizen_user_id, department_id, record_type, record_reference,
            full_name, date_of_birth, address, record_version, created_at, updated_at
     FROM citizen_records
     WHERE citizen_user_id = ?
     ORDER BY id`,
    [userId]
  );
  return rows;
}

async function findByReference(recordRef) {
  const [rows] = await pool.query(
    `SELECT id, citizen_user_id, department_id, record_type, record_reference,
            full_name, date_of_birth, address, record_version, created_at, updated_at
     FROM citizen_records
     WHERE record_reference = ?
     LIMIT 1`,
    [recordRef]
  );
  return rows[0] || null;
}

module.exports = { findByCitizenId, findByReference };