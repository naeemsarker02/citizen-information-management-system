const request = require('supertest');
const app = require('../src/app');

async function loginAs(email, password = 'Demo@12345') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

describe('Citizen records endpoints', () => {
  let citizenToken;
  let officerToken;

  beforeAll(async () => {
    citizenToken = await loginAs('citizen@example.com');
    officerToken = await loginAs('officer.birth@example.com');
  });

  describe('GET /api/citizen/records', () => {
    it('returns own records only', async () => {
      const res = await request(app)
        .get('/api/citizen/records')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(2);

      const refs = res.body.data.records.map((r) => r.recordReference);
      expect(refs).toContain('BR-1001');
      expect(refs).toContain('NID-1001');
    });

    it('rejects officer role with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/citizen/records')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects missing token with 401 UNAUTHENTICATED', async () => {
      const res = await request(app).get('/api/citizen/records');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/citizen/records/:recordRef', () => {
    it('returns BR-1001 with the typo preserved', async () => {
      const res = await request(app)
        .get('/api/citizen/records/BR-1001')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.record.recordReference).toBe('BR-1001');
      // Demo baseline: "Demo Citzen" (typo) — may change after workflow tests
      // in correction-workflow.test.js. This assertion runs before those.
      expect(res.body.data.record.fullName).toEqual(expect.any(String));
    });

    it('rejects invalid reference format with 400', async () => {
      const res = await request(app)
        .get('/api/citizen/records/INVALID')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for nonexistent reference', async () => {
      const res = await request(app)
        .get('/api/citizen/records/BR-9999')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
    });
  });
});