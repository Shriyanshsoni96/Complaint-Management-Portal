import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Department from '../src/models/Department.js';
import { ROLES } from '../src/constants/roles.js';
import { createUser, authHeader } from './helpers/factories.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Category API', () => {
  it('rejects a citizen creating a category with 403', async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const res = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: department._id.toString() });

    expect(res.status).toBe(403);
  });

  it('rejects a non-existent department id with 404', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(404);
  });

  it('rejects a malformed department id with 422', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: 'not-an-id' });
    expect(res.status).toBe(422);
  });

  it('creates a category and rejects a duplicate name within the same department', async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const { token } = await createUser({ role: ROLES.ADMIN });

    const createRes = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: department._id.toString() });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.category.department.departmentName).toBe('Water Supply');

    const dupRes = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: department._id.toString() });
    expect(dupRes.status).toBe(409);
  });

  it('allows the same category name under a different department', async () => {
    const water = await Department.create({ departmentName: 'Water Supply' });
    const electricity = await Department.create({ departmentName: 'Electricity' });
    const { token } = await createUser({ role: ROLES.ADMIN });

    await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Outage', department: water._id.toString() });

    const res = await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Outage', department: electricity._id.toString() });

    expect(res.status).toBe(201);
  });

  it('filters categories by department', async () => {
    const water = await Department.create({ departmentName: 'Water Supply' });
    const electricity = await Department.create({ departmentName: 'Electricity' });
    const { token } = await createUser({ role: ROLES.ADMIN });

    await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: water._id.toString() });
    await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Outage', department: electricity._id.toString() });

    const res = await request(app)
      .get(`/api/v1/categories?department=${water._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(1);
    expect(res.body.data.categories[0].categoryName).toBe('Pipeline Leak');
  });
});
