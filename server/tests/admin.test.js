import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Department from '../src/models/Department.js';
import Category from '../src/models/Category.js';
import Complaint from '../src/models/Complaint.js';
import User from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';
import { createUser, authHeader } from './helpers/factories.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Admin API', () => {
  describe('user management', () => {
    it('rejects non-admins from admin routes with 403', async () => {
      const { token } = await createUser({ role: ROLES.CITIZEN });
      const res = await request(app).get('/api/v1/admin/users').set(authHeader(token));
      expect(res.status).toBe(403);
    });

    it('requires a department when promoting a user to officer', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { user: citizen } = await createUser({ role: ROLES.CITIZEN });

      const res = await request(app)
        .put(`/api/v1/admin/users/${citizen._id}`)
        .set(authHeader(adminToken))
        .send({ role: 'officer' });

      expect(res.status).toBe(400);
    });

    it('promotes a citizen to officer with a valid department', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { user: citizen } = await createUser({ role: ROLES.CITIZEN });
      const department = await Department.create({ departmentName: 'Water Supply' });

      const res = await request(app)
        .put(`/api/v1/admin/users/${citizen._id}`)
        .set(authHeader(adminToken))
        .send({ role: 'officer', department: department._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('officer');
    });

    it('prevents an admin from changing their own role or deactivating themselves', async () => {
      const { user: admin, token } = await createUser({ role: ROLES.ADMIN });

      const roleRes = await request(app)
        .put(`/api/v1/admin/users/${admin._id}`)
        .set(authHeader(token))
        .send({ role: 'citizen' });
      expect(roleRes.status).toBe(400);

      const deactivateRes = await request(app)
        .delete(`/api/v1/admin/users/${admin._id}`)
        .set(authHeader(token));
      expect(deactivateRes.status).toBe(400);
    });

    it('deactivates a user and blocks their subsequent login', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { user: citizen } = await createUser({
        role: ROLES.CITIZEN,
        email: 'citizen@example.com',
        password: 'Password123',
      });

      const res = await request(app)
        .delete(`/api/v1/admin/users/${citizen._id}`)
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'citizen@example.com', password: 'Password123' });
      expect(loginRes.status).toBe(401);
    });
  });

  describe('complaint assignment', () => {
    async function seedComplaint() {
      const department = await Department.create({ departmentName: 'Water Supply' });
      const category = await Category.create({
        categoryName: 'Pipeline Leak',
        department: department._id,
      });
      const { user: citizen } = await createUser({ role: ROLES.CITIZEN });
      const complaint = await Complaint.create({
        complaintId: `CMP-TEST-${Date.now()}`,
        title: 'Leak near school',
        description: 'A detailed description of a leaking pipe near the school gate.',
        category: category._id,
        department: department._id,
        createdBy: citizen._id,
        address: '5 Oak St',
        city: 'Springfield',
        state: 'IL',
      });
      return { department, complaint };
    }

    it('rejects assigning an officer from a different department with 400', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { department, complaint } = await seedComplaint();
      const otherDepartment = await Department.create({ departmentName: 'Electricity' });
      const { user: officer } = await createUser({ role: ROLES.OFFICER, department: otherDepartment._id });

      const res = await request(app)
        .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
        .set(authHeader(adminToken))
        .send({ officerId: officer._id.toString(), departmentId: department._id.toString() });

      expect(res.status).toBe(400);
    });

    it('rejects assigning to an inactive officer with 400', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { department, complaint } = await seedComplaint();
      const { user: officer } = await createUser({
        role: ROLES.OFFICER,
        department: department._id,
        isActive: false,
      });

      const res = await request(app)
        .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
        .set(authHeader(adminToken))
        .send({ officerId: officer._id.toString(), departmentId: department._id.toString() });

      expect(res.status).toBe(400);
    });

    it('assigns a complaint successfully and records a timeline entry', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { department, complaint } = await seedComplaint();
      const { user: officer } = await createUser({ role: ROLES.OFFICER, department: department._id });

      const res = await request(app)
        .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
        .set(authHeader(adminToken))
        .send({ officerId: officer._id.toString(), departmentId: department._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.complaint.status).toBe('Assigned');
      expect(res.body.data.complaint.assignedTo._id).toBe(officer._id.toString());

      const timelineRes = await request(app)
        .get(`/api/v1/complaints/${complaint._id}/timeline`)
        .set(authHeader(adminToken));
      expect(timelineRes.body.data.timeline).toHaveLength(1);
      expect(timelineRes.body.data.timeline[0].currentStatus).toBe('Assigned');
    });

    it('blocks assigning a complaint that is already Resolved or Closed', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { department, complaint } = await seedComplaint();
      const { user: officer } = await createUser({ role: ROLES.OFFICER, department: department._id });
      await Complaint.findByIdAndUpdate(complaint._id, { status: 'Resolved' });

      const res = await request(app)
        .patch(`/api/v1/admin/complaints/${complaint._id}/assign`)
        .set(authHeader(adminToken))
        .send({ officerId: officer._id.toString(), departmentId: department._id.toString() });

      expect(res.status).toBe(409);
    });
  });

  describe('dashboard stats', () => {
    it('returns activeUsers, totalUsers and a 6-entry zero-filled monthlyTrends', async () => {
      const { token: adminToken } = await createUser({ role: ROLES.ADMIN });
      const { user: citizen } = await createUser({ role: ROLES.CITIZEN });
      await User.findByIdAndUpdate(citizen._id, { isActive: false });

      const res = await request(app).get('/api/v1/admin/dashboard').set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(2);
      expect(res.body.data.activeUsers).toBe(1);
      expect(res.body.data.monthlyTrends).toHaveLength(6);
      expect(res.body.data.monthlyTrends.every((entry) => entry.count === 0)).toBe(true);
    });
  });
});
