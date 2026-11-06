const request = require('supertest');
const app = require('../src/app');

describe('Auth endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('returns JWT + safe user for a valid citizen', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@example.com', password: 'Demo@12345' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.token.split('.')).toHaveLength(3); // JWT shape

      expect(res.body.data.user).toMatchObject({
        id: 1,
        email: 'citizen@example.com',
        role: 'CITIZEN',
        departmentId: null,
      });
      // No password hash or secret leak
      expect(res.body.data.user).not.toHaveProperty('password_hash');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('returns officer user with departmentId for a valid officer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'officer.birth@example.com', password: 'Demo@12345' });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toMatchObject({
        role: 'OFFICER',
        departmentId: 2,
      });
    });

    it('rejects wrong password with 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects malformed email with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 UNAUTHENTICATED without a token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns the current user with a valid token', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@example.com', password: 'Demo@12345' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('citizen@example.com');
      expect(res.body.data.user.role).toBe('CITIZEN');
    });
  });
});