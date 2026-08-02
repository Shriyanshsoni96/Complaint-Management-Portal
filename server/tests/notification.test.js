import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Department from '../src/models/Department.js';
import Category from '../src/models/Category.js';
import { ROLES } from '../src/constants/roles.js';
import { createUser, authHeader } from './helpers/factories.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Notification API', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('notifies admins (not the citizen) when a complaint is submitted', async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });
    const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
    const { token: citizenToken } = await createUser({ role: ROLES.CITIZEN });

    await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(citizenToken))
      .send({
        title: 'Leak near school',
        description: 'A detailed description of a leaking pipe near the school gate.',
        category: category._id.toString(),
        department: department._id.toString(),
        address: '5 Oak St',
        city: 'Springfield',
        state: 'IL',
      });

    const adminRes = await request(app).get('/api/v1/notifications').set(authHeader(adminToken));
    expect(adminRes.body.data.total).toBe(1);
    expect(adminRes.body.data.notifications[0].title).toBe('New complaint submitted');

    const citizenRes = await request(app).get('/api/v1/notifications').set(authHeader(citizenToken));
    expect(citizenRes.body.data.total).toBe(0);
  });

  it('marks a notification as read and updates the unread count', async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });
    const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
    const { token: citizenToken } = await createUser({ role: ROLES.CITIZEN });

    await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(citizenToken))
      .send({
        title: 'Leak near school',
        description: 'A detailed description of a leaking pipe near the school gate.',
        category: category._id.toString(),
        department: department._id.toString(),
        address: '5 Oak St',
        city: 'Springfield',
        state: 'IL',
      });

    const listRes = await request(app).get('/api/v1/notifications').set(authHeader(adminToken));
    expect(listRes.body.data.unreadCount).toBe(1);
    const notificationId = listRes.body.data.notifications[0]._id;

    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set(authHeader(adminToken));
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);

    const afterRes = await request(app).get('/api/v1/notifications').set(authHeader(adminToken));
    expect(afterRes.body.data.unreadCount).toBe(0);
  });

  it("rejects reading or deleting another user's notification with 404", async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });
    const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
    const { token: citizenToken } = await createUser({ role: ROLES.CITIZEN });

    await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(citizenToken))
      .send({
        title: 'Leak near school',
        description: 'A detailed description of a leaking pipe near the school gate.',
        category: category._id.toString(),
        department: department._id.toString(),
        address: '5 Oak St',
        city: 'Springfield',
        state: 'IL',
      });

    const listRes = await request(app).get('/api/v1/notifications').set(authHeader(adminToken));
    const notificationId = listRes.body.data.notifications[0]._id;

    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set(authHeader(citizenToken));
    expect(readRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/notifications/${notificationId}`)
      .set(authHeader(citizenToken));
    expect(deleteRes.status).toBe(404);
  });
});
