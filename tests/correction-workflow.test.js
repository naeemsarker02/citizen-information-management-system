const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

// Isolated test fixtures — do not touch demo accounts/records
const TEST_USER = {
  id: 99,
  email: 'test-citizen@example.com',
  password: 'Test@12345',
  name: 'Test Citizen',
};
const TEST_RECORD = {
  id: 99,
  ref: 'BR-9001',
  departmentId: 2, // BIRTH_REGISTRATION
  initialName: 'Test Name',
};

let citizenToken;
let officerToken;
let approvedRequestId;
let rejectedRequestId;

async function loginAs(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

describe('Correction workflow', () => {
  beforeAll(async () => {
    // ── Setup: test citizen + test record ─────────────────
    const hash = await hashPassword(TEST_USER.password);

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, department_id, is_active)
       VALUES (?, ?, ?, ?, 'CITIZEN', NULL, TRUE)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         is_active = TRUE`,
      [TEST_USER.id, TEST_USER.name, TEST_USER.email, hash]
    );

    await pool.query(
      `INSERT INTO citizen_records
         (id, citizen_user_id, department_id, record_type, record_reference,
          full_name, date_of_birth, address, record_version)
       VALUES (?, ?, ?, 'BIRTH_REGISTRATION', ?, ?, '1990-01-01', 'Test Address', 1)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         record_version = 1`,
      [TEST_RECORD.id, TEST_USER.id, TEST_RECORD.departmentId, TEST_RECORD.ref, TEST_RECORD.initialName]
    );

    citizenToken = await loginAs(TEST_USER.email, TEST_USER.password);
    officerToken = await loginAs('officer.birth@example.com', 'Demo@12345');
  });

  afterAll(async () => {
    // ── Cleanup in FK order ────────────────────────────────
    await pool.query(
      'DELETE FROM audit_logs WHERE entity_id IN (SELECT id FROM correction_requests WHERE citizen_user_id = ?)',
      [TEST_USER.id]
    );
    await pool.query('DELETE FROM correction_requests WHERE citizen_user_id = ?', [TEST_USER.id]);
    await pool.query('DELETE FROM citizen_records WHERE citizen_user_id = ?', [TEST_USER.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [TEST_USER.id]);
  });

  describe('Citizen: create correction request', () => {
    it('creates a PENDING request with DB-derived old value + version', async () => {
      const res = await request(app)
        .post(`/api/citizen/records/${TEST_RECORD.ref}/correction-requests`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          changes: [{ fieldName: 'full_name', proposedValue: 'Test Name Updated' }],
          reason: 'Testing correction creation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.request).toMatchObject({
        status: 'PENDING',
        oldValue: TEST_RECORD.initialName,
        proposedValue: 'Test Name Updated',
        expectedRecordVersion: 1,
        fieldName: 'full_name',
      });

      approvedRequestId = res.body.data.request.id;

      // Audit row exists with pointer metadata only
      const [audits] = await pool.query(
        `SELECT action, metadata FROM audit_logs
         WHERE entity_type = 'correction_request' AND entity_id = ?`,
        [approvedRequestId]
      );
      expect(audits.length).toBeGreaterThanOrEqual(1);
      const submitAudit = audits.find((a) => a.action === 'REQUEST_SUBMITTED');
      expect(submitAudit).toBeDefined();
      expect(submitAudit.metadata).toMatchObject({
        recordId: TEST_RECORD.id,
        fieldName: 'full_name',
      });
      expect(submitAudit.metadata).not.toHaveProperty('oldValue');
      expect(submitAudit.metadata).not.toHaveProperty('newValue');
    });

    it('rejects duplicate PENDING for same record+field with 409', async () => {
      const res = await request(app)
        .post(`/api/citizen/records/${TEST_RECORD.ref}/correction-requests`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          changes: [{ fieldName: 'full_name', proposedValue: 'Other Name' }],
          reason: 'Duplicate attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_PENDING_REQUEST');
    });

    it('rejects no-op (proposed === current) with 400', async () => {
      // Record still has initialName because nothing approved yet
      const res = await request(app)
        .post(`/api/citizen/records/${TEST_RECORD.ref}/correction-requests`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          changes: [{ fieldName: 'full_name', proposedValue: TEST_RECORD.initialName }],
          reason: 'No-op test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('NO_CHANGE_REQUESTED');
    });
  });

  describe('Officer: approve', () => {
    it('approves PENDING request and increments record version', async () => {
      const res = await request(app)
        .patch(`/api/officer/correction-requests/${approvedRequestId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('APPROVED');
      expect(res.body.data.request.review).toMatchObject({
        reviewerId: 2,
        reviewerName: expect.any(String),
      });

      // Verify DB state
      const [recRows] = await pool.query(
        'SELECT full_name, record_version FROM citizen_records WHERE id = ?',
        [TEST_RECORD.id]
      );
      expect(recRows[0].full_name).toBe('Test Name Updated');
      expect(recRows[0].record_version).toBe(2);

      // Audit REQUEST_APPROVED exists
      const [audits] = await pool.query(
        `SELECT action, metadata FROM audit_logs
         WHERE entity_id = ? AND action = 'REQUEST_APPROVED'`,
        [approvedRequestId]
      );
      expect(audits.length).toBe(1);
      expect(audits[0].metadata).toMatchObject({ recordId: TEST_RECORD.id });
      expect(audits[0].metadata).not.toHaveProperty('oldName');
      expect(audits[0].metadata).not.toHaveProperty('newName');
    });

    it('rejects double-approval of the same request with 409', async () => {
      const res = await request(app)
        .patch(`/api/officer/correction-requests/${approvedRequestId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REQUEST_ALREADY_PROCESSED');
    });
  });

  describe('Officer: reject', () => {
    it('creates a second request against the updated record', async () => {
      const res = await request(app)
        .post(`/api/citizen/records/${TEST_RECORD.ref}/correction-requests`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          changes: [{ fieldName: 'full_name', proposedValue: 'Rejected Name' }],
          reason: 'Testing rejection flow',
        });

      expect(res.status).toBe(201);
      // Old value must reflect the prior approval
      expect(res.body.data.request.oldValue).toBe('Test Name Updated');
      expect(res.body.data.request.expectedRecordVersion).toBe(2);

      rejectedRequestId = res.body.data.request.id;
    });

    it('rejects with reason and leaves record unchanged', async () => {
      const res = await request(app)
        .patch(`/api/officer/correction-requests/${rejectedRequestId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'REJECTED', reason: 'Supporting information is insufficient.' });

      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('REJECTED');
      expect(res.body.data.request.review.rejectionReason).toBe(
        'Supporting information is insufficient.'
      );

      // Record must remain at approved state
      const [recRows] = await pool.query(
        'SELECT full_name, record_version FROM citizen_records WHERE id = ?',
        [TEST_RECORD.id]
      );
      expect(recRows[0].full_name).toBe('Test Name Updated');
      expect(recRows[0].record_version).toBe(2);

      // Audit REQUEST_REJECTED exists
      const [audits] = await pool.query(
        `SELECT action FROM audit_logs
         WHERE entity_id = ? AND action = 'REQUEST_REJECTED'`,
        [rejectedRequestId]
      );
      expect(audits.length).toBe(1);
    });

    it('rejects REJECTED decision without reason with 400', async () => {
      // Create a fresh request, then try to reject without reason
      const create = await request(app)
        .post(`/api/citizen/records/${TEST_RECORD.ref}/correction-requests`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          changes: [{ fieldName: 'full_name', proposedValue: 'Another Name' }],
          reason: 'For missing-reason test',
        });
      const freshId = create.body.data.request.id;

      const res = await request(app)
        .patch(`/api/officer/correction-requests/${freshId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'REJECTED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Cleanup fresh request to leave clean state (still PENDING → use reject-with-reason for cleanliness)
      await request(app)
        .patch(`/api/officer/correction-requests/${freshId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'REJECTED', reason: 'Cleanup after test' });
    });
  });
});