// Automates the exact "Manual Test Scenarios" list from the Development
// Roadmap's Milestone 12 (Testing):
//   1. Citizen creates complaint.
//   2. Admin assigns complaint.
//   3. Officer updates status.
//   4. Citizen receives notification.
//   5. Complaint is resolved and closed.
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

describe('Complaint lifecycle (end-to-end)', () => {
  it('walks a complaint from submission through to Resolved and Closed', async () => {
    const department = await Department.create({ departmentName: 'Water Supply' });
    const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });

    const { token: adminToken } = await createUser({ role: ROLES.ADMIN, email: 'admin@example.com' });
    const { token: citizenToken } = await createUser({ role: ROLES.CITIZEN, email: 'citizen@example.com' });
    const { user: officer, token: officerToken } = await createUser({
      role: ROLES.OFFICER,
      department: department._id,
      email: 'officer@example.com',
    });

    // 1. Citizen creates complaint.
    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(citizenToken))
      .send({
        title: 'Pipeline leak near school',
        description: 'A detailed description of a leaking pipe near the school gate.',
        category: category._id.toString(),
        department: department._id.toString(),
        priority: 'High',
        address: '5 Oak St',
        city: 'Springfield',
        state: 'IL',
      });
    expect(createRes.status).toBe(201);
    const complaintId = createRes.body.data.complaint._id;
    expect(createRes.body.data.complaint.status).toBe('Pending');

    // 2. Admin assigns complaint.
    const assignRes = await request(app)
      .patch(`/api/v1/admin/complaints/${complaintId}/assign`)
      .set(authHeader(adminToken))
      .send({ officerId: officer._id.toString(), departmentId: department._id.toString() });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.complaint.status).toBe('Assigned');
    expect(assignRes.body.data.complaint.assignedTo._id).toBe(officer._id.toString());

    // The complaint now shows up in the officer's own assigned queue.
    const assignedListRes = await request(app)
      .get('/api/v1/officer/complaints')
      .set(authHeader(officerToken));
    expect(assignedListRes.body.data.total).toBe(1);

    // 3. Officer updates status (Assigned -> In Progress -> Resolved -> Closed).
    const inProgressRes = await request(app)
      .patch(`/api/v1/officer/complaints/${complaintId}/status`)
      .set(authHeader(officerToken))
      .send({ status: 'In Progress', remarks: 'Investigating the leak' });
    expect(inProgressRes.status).toBe(200);
    expect(inProgressRes.body.data.complaint.status).toBe('In Progress');

    // 4. Citizen receives a notification at each meaningful step so far
    // (submission notified admins, assignment notified the citizen).
    const citizenNotifsRes = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(citizenToken));
    expect(citizenNotifsRes.body.data.total).toBeGreaterThanOrEqual(1);
    expect(
      citizenNotifsRes.body.data.notifications.some((n) => n.title === 'Complaint assigned'),
    ).toBe(true);

    // 5. Complaint is resolved and closed.
    const resolvedRes = await request(app)
      .patch(`/api/v1/officer/complaints/${complaintId}/status`)
      .set(authHeader(officerToken))
      .send({ status: 'Resolved', remarks: 'Pipe replaced and leak fixed' });
    expect(resolvedRes.status).toBe(200);
    expect(resolvedRes.body.data.complaint.status).toBe('Resolved');

    const closedRes = await request(app)
      .patch(`/api/v1/officer/complaints/${complaintId}/status`)
      .set(authHeader(officerToken))
      .send({ status: 'Closed' });
    expect(closedRes.status).toBe(200);
    expect(closedRes.body.data.complaint.status).toBe('Closed');

    // The citizen should have been notified of the resolution too, with a
    // "success" styled notification (see notification.service.js).
    const finalNotifsRes = await request(app)
      .get('/api/v1/notifications')
      .set(authHeader(citizenToken));
    const resolvedNotification = finalNotifsRes.body.data.notifications.find((n) =>
      n.message.includes('Resolved'),
    );
    expect(resolvedNotification).toBeTruthy();
    expect(resolvedNotification.type).toBe('success');

    // The full timeline reflects every transition in order, end to end.
    const timelineRes = await request(app)
      .get(`/api/v1/complaints/${complaintId}/timeline`)
      .set(authHeader(citizenToken));
    expect(timelineRes.body.data.timeline.map((entry) => entry.currentStatus)).toEqual([
      'Pending',
      'Assigned',
      'In Progress',
      'Resolved',
      'Closed',
    ]);
  });
});
