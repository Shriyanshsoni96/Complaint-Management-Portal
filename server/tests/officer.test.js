import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Department from '../src/models/Department.js';
import Category from '../src/models/Category.js';
import Complaint from '../src/models/Complaint.js';
import { ROLES } from '../src/constants/roles.js';
import { createUser, authHeader } from './helpers/factories.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

let complaintCounter = 0;

async function createDeptAndCategory() {
  const department = await Department.create({ departmentName: 'Water Supply' });
  const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });
  return { department, category };
}

async function createAssignedComplaint(officerId, department, category, overrides = {}) {
  complaintCounter += 1;
  const { user: citizen } = await createUser({
    role: ROLES.CITIZEN,
    email: `citizen${Date.now()}${complaintCounter}@example.com`,
  });
  return Complaint.create({
    complaintId: `CMP-TEST-${Date.now()}-${complaintCounter}`,
    title: 'Leak near school',
    description: 'A detailed description of a leaking pipe near the school gate.',
    category: category._id,
    department: department._id,
    createdBy: citizen._id,
    assignedTo: officerId,
    status: 'Assigned',
    address: '5 Oak St',
    city: 'Springfield',
    state: 'IL',
    ...overrides,
  });
}

describe('Officer API', () => {
  it('rejects citizens and admins from the officer routes with 403', async () => {
    const { token: citizenToken } = await createUser({ role: ROLES.CITIZEN });
    const { token: adminToken } = await createUser({ role: ROLES.ADMIN });

    const citizenRes = await request(app).get('/api/v1/officer/complaints').set(authHeader(citizenToken));
    const adminRes = await request(app).get('/api/v1/officer/complaints').set(authHeader(adminToken));

    expect(citizenRes.status).toBe(403);
    expect(adminRes.status).toBe(403);
  });

  it('only returns complaints assigned to the requesting officer', async () => {
    const { department, category } = await createDeptAndCategory();
    const { user: officerA, token: officerAToken } = await createUser({
      role: ROLES.OFFICER,
      department: department._id,
      email: 'officerA@example.com',
    });
    const { token: officerBToken } = await createUser({
      role: ROLES.OFFICER,
      department: department._id,
      email: 'officerB@example.com',
    });
    await createAssignedComplaint(officerA._id, department, category);

    const aRes = await request(app).get('/api/v1/officer/complaints').set(authHeader(officerAToken));
    const bRes = await request(app).get('/api/v1/officer/complaints').set(authHeader(officerBToken));

    expect(aRes.body.data.total).toBe(1);
    expect(bRes.body.data.total).toBe(0);
  });

  it('rejects an officer updating a complaint not assigned to them with 403', async () => {
    const { department, category } = await createDeptAndCategory();
    const { user: officerA } = await createUser({
      role: ROLES.OFFICER,
      department: department._id,
      email: 'officerA@example.com',
    });
    const { token: officerBToken } = await createUser({
      role: ROLES.OFFICER,
      department: department._id,
      email: 'officerB@example.com',
    });
    const complaint = await createAssignedComplaint(officerA._id, department, category);

    const res = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(officerBToken))
      .send({ status: 'In Progress' });

    expect(res.status).toBe(403);
  });

  it('rejects skipping ahead in the status lifecycle with 409', async () => {
    const { department, category } = await createDeptAndCategory();
    const { user: officer, token } = await createUser({ role: ROLES.OFFICER, department: department._id });
    const complaint = await createAssignedComplaint(officer._id, department, category);

    const res = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(token))
      .send({ status: 'Resolved' });

    expect(res.status).toBe(409);
  });

  it('walks a complaint through the full lifecycle and records each transition', async () => {
    const { department, category } = await createDeptAndCategory();
    const { user: officer, token } = await createUser({ role: ROLES.OFFICER, department: department._id });
    const complaint = await createAssignedComplaint(officer._id, department, category);

    const step1 = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(token))
      .send({ status: 'In Progress', remarks: 'Investigating' });
    expect(step1.status).toBe(200);

    const step2 = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(token))
      .send({ status: 'Resolved', remarks: 'Pipe replaced' });
    expect(step2.status).toBe(200);

    const step3 = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(token))
      .send({ status: 'Closed' });
    expect(step3.status).toBe(200);
    expect(step3.body.data.complaint.status).toBe('Closed');

    const timelineRes = await request(app)
      .get(`/api/v1/complaints/${complaint._id}/timeline`)
      .set(authHeader(token));
    expect(timelineRes.body.data.timeline.map((entry) => entry.currentStatus)).toEqual([
      'In Progress',
      'Resolved',
      'Closed',
    ]);

    const terminalRes = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/status`)
      .set(authHeader(token))
      .send({ status: 'In Progress' });
    expect(terminalRes.status).toBe(409);
  });

  it('adds a resolution note without creating a new timeline entry', async () => {
    const { department, category } = await createDeptAndCategory();
    const { user: officer, token } = await createUser({ role: ROLES.OFFICER, department: department._id });
    const complaint = await createAssignedComplaint(officer._id, department, category);

    const res = await request(app)
      .patch(`/api/v1/officer/complaints/${complaint._id}/note`)
      .set(authHeader(token))
      .send({ resolutionNote: 'Pipe replaced.' });

    expect(res.status).toBe(200);
    expect(res.body.data.complaint.resolutionNote).toBe('Pipe replaced.');

    const timelineRes = await request(app)
      .get(`/api/v1/complaints/${complaint._id}/timeline`)
      .set(authHeader(token));
    expect(timelineRes.body.data.timeline).toHaveLength(0);
  });
});
