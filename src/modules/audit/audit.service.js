const auditRepo = require('./audit.repository');

/**
 * Log an audit event within the caller's transaction.
 *
 * @param {import('mysql2/promise').PoolConnection} conn - Caller's transaction connection
 * @param {object} entry
 * @param {number} entry.actorUserId - Who performed the action
 * @param {string} entry.action - Action name (e.g. 'REQUEST_SUBMITTED')
 * @param {string} entry.entityType - Entity affected (e.g. 'correction_request')
 * @param {number} entry.entityId - ID of the affected entity
 * @param {object} [entry.metadata] - Pointers/versions only; NO PII
 */
async function logAudit(conn, entry) {
  if (!conn) {
    throw new Error('logAudit requires a transaction connection');
  }
  await auditRepo.insert(conn, entry);
}

module.exports = { logAudit };