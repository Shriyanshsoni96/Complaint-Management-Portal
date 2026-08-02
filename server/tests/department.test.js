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

describe('Department API', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/departments');
    expect(res.status).toBe(401);
  });

  it('allows a citizen to read the department list', async () => {
    const { token } = await createUser({ role: ROLES.CITIZEN });
    const res = await request(app).get('/api/v1/departments').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.departments).toEqual([]);
  });

  it('rejects a citizen creating a department with 403', async () => {
    const { token } = await createUser({ role: ROLES.CITIZEN });
    const res = await request(app)
      .post('/api/v1/departments')
      .set(authHeader(token))
      .send({ departmentName: 'Water Supply' });
    expect(res.status).toBe(403);
  });

  it('rejects an empty department name with 422', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app)
      .post('/api/v1/departments')
      .set(authHeader(token))
      .send({ departmentName: '   ' });
    expect(res.status).toBe(422);
  });

  it('lets an admin create a department, then rejects a duplicate name', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });

    const createRes = await request(app)
      .post('/api/v1/departments')
      .set(authHeader(token))
      .send({ departmentName: 'Water Supply' });
    expect(createRes.status).toBe(201);

    const dupRes = await request(app)
      .post('/api/v1/departments')
      .set(authHeader(token))
      .send({ departmentName: 'Water Supply' });
    expect(dupRes.status).toBe(409);
  });

  it('lets an admin update a department', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const department = await Department.create({ departmentName: 'Roads' });

    const res = await request(app)
      .put(`/api/v1/departments/${department._id}`)
      .set(authHeader(token))
      .send({ departmentName: 'Roads & Infrastructure' });

    expect(res.status).toBe(200);
    expect(res.body.data.department.departmentName).toBe('Roads & Infrastructure');
  });

  it('blocks deleting a department that still has categories assigned', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const department = await Department.create({ departmentName: 'Water Supply' });
    await request(app)
      .post('/api/v1/categories')
      .set(authHeader(token))
      .send({ categoryName: 'Pipeline Leak', department: department._id.toString() });

    const res = await request(app)
      .delete(`/api/v1/departments/${department._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(409);
  });

  it('deletes an empty department successfully', async () => {
    const { token } = await createUser({ role: ROLES.ADMIN });
    const department = await Department.create({ departmentName: 'Water Supply' });

    const res = await request(app)
      .delete(`/api/v1/departments/${department._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(await Department.findById(department._id)).toBeNull();
  });
});
