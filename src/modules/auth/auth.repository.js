const { pool } = require('../../config/database');

// ── Used by login (M1.10) ────────────────────────────────
async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash, role, department_id, is_active
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

// ── Used by authenticate middleware (future refactor) ────
async function findAuthUserById(userId) {
  const [rows] = await pool.execute(
    `SELECT
        u.id, u.name, u.email, u.role, u.department_id, u.is_active,
        d.is_active AS department_is_active
     FROM users AS u
     LEFT JOIN departments AS d ON d.id = u.department_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = { findUserByEmail, findAuthUserById };