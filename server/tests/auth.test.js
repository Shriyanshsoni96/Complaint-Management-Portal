import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const validRegister = {
  name: 'Jane Citizen',
  email: 'jane@example.com',
  password: 'Password123',
  phone: '9876543210',
};

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new citizen', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validRegister);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const stored = await User.findOne({ email: validRegister.email });
      expect(stored).not.toBeNull();
      expect(stored.role).toBe('citizen');
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app).post('/api/v1/auth/register').send(validRegister);
      const res = await request(app).post('/api/v1/auth/register').send(validRegister);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects a password shorter than 8 characters with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegister, password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.errors[0].path).toBe('password');
    });

    it('never returns the password field', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validRegister);
      expect(res.body.data.password).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      await request(app).post('/api/v1/auth/register').send(validRegister);
    });

    it('logs in with correct credentials and returns a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: validRegister.password });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(validRegister.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects an incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me (authentication)', () => {
    it('rejects a request with no token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects a request with an invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      await request(app).post('/api/v1/auth/register').send(validRegister);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: validRegister.password });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validRegister.email);
    });
  });

  describe('PATCH /api/v1/auth/change-password', () => {
    it('changes the password and rejects the old one afterwards', async () => {
      await request(app).post('/api/v1/auth/register').send(validRegister);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: validRegister.password });
      const token = loginRes.body.data.token;

      const changeRes = await request(app)
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: validRegister.password, newPassword: 'NewPassword456' });
      expect(changeRes.status).toBe(200);

      const oldLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: validRegister.password });
      expect(oldLoginRes.status).toBe(401);

      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: 'NewPassword456' });
      expect(newLoginRes.status).toBe(200);
    });
  });
});
