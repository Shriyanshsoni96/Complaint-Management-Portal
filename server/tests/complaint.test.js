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

async function seedDeptAndCategory() {
  const department = await Department.create({ departmentName: 'Water Supply' });
  const category = await Category.create({ categoryName: 'Pipeline Leak', department: department._id });
  return { department, category };
}

const basePayload = (department, category) => ({
  title: 'Leak near school',
  description: 'A detailed description of a leaking pipe near the school gate.',
  category: category._id.toString(),
  department: department._id.toString(),
  address: '5 Oak St',
  city: 'Springfield',
  state: 'IL',
});

describe('Complaint API', () => {
  it('rejects an officer creating a complaint with 403 (citizen-only)', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.OFFICER, department: department._id });

    const res = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .send(basePayload(department, category));

    expect(res.status).toBe(403);
  });

  it('rejects missing required fields with 422', async () => {
    const { token } = await createUser({ role: ROLES.CITIZEN });
    const res = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .send({ title: '' });
    expect(res.status).toBe(422);
  });

  it('creates a complaint with a generated tracking id and an initial timeline entry', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const res = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .field('title', 'Leak near school')
      .field('description', 'A detailed description of a leaking pipe near the school gate.')
      .field('category', category._id.toString())
      .field('department', department._id.toString())
      .field('address', '5 Oak St')
      .field('city', 'Springfield')
      .field('state', 'IL')
      .attach('images', Buffer.from('fake-image-bytes'), {
        filename: 'leak.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.complaint.complaintId).toMatch(/^CMP-\d{8}-[0-9A-F]{6}$/);
    expect(res.body.data.complaint.images).toHaveLength(1);
    expect(res.body.data.complaint.status).toBe('Pending');

    const timelineRes = await request(app)
      .get(`/api/v1/complaints/${res.body.data.complaint._id}/timeline`)
      .set(authHeader(token));
    expect(timelineRes.body.data.timeline).toHaveLength(1);
    expect(timelineRes.body.data.timeline[0].currentStatus).toBe('Pending');
  });

  it('rejects a non-image file upload with 422', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const res = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .field('title', 'Leak near school')
      .field('description', 'A detailed description of a leaking pipe near the school gate.')
      .field('category', category._id.toString())
      .field('department', department._id.toString())
      .field('address', '5 Oak St')
      .field('city', 'Springfield')
      .field('state', 'IL')
      .attach('images', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(422);
  });

  it("scopes the complaint list to the citizen's own complaints, but shows all to staff", async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token: citizenAToken } = await createUser({
      role: ROLES.CITIZEN,
      email: 'a@example.com',
    });
    const { token: citizenBToken } = await createUser({
      role: ROLES.CITIZEN,
      email: 'b@example.com',
    });
    const { token: adminToken } = await createUser({ role: ROLES.ADMIN });

    await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(citizenAToken))
      .send(basePayload(department, category));

    const [aRes, bRes, adminRes] = await Promise.all([
      request(app).get('/api/v1/complaints').set(authHeader(citizenAToken)),
      request(app).get('/api/v1/complaints').set(authHeader(citizenBToken)),
      request(app).get('/api/v1/complaints').set(authHeader(adminToken)),
    ]);

    expect(aRes.body.data.total).toBe(1);
    expect(bRes.body.data.total).toBe(0);
    expect(adminRes.body.data.total).toBe(1);
  });

  it('blocks a non-owner citizen from viewing a complaint with 403', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token: ownerToken } = await createUser({ role: ROLES.CITIZEN, email: 'owner@example.com' });
    const { token: otherToken } = await createUser({ role: ROLES.CITIZEN, email: 'other@example.com' });

    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(ownerToken))
      .send(basePayload(department, category));

    const res = await request(app)
      .get(`/api/v1/complaints/${createRes.body.data.complaint._id}`)
      .set(authHeader(otherToken));

    expect(res.status).toBe(403);
  });

  it('lets the owner update a complaint while Pending, then locks it after assignment', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .send(basePayload(department, category));
    const id = createRes.body.data.complaint._id;

    const updateRes = await request(app)
      .put(`/api/v1/complaints/${id}`)
      .set(authHeader(token))
      .send({ title: 'Updated title' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.complaint.title).toBe('Updated title');

    await Complaint.findByIdAndUpdate(id, { status: 'Assigned', assignedTo: (await createUser()).user._id });

    const lockedRes = await request(app)
      .put(`/api/v1/complaints/${id}`)
      .set(authHeader(token))
      .send({ title: 'Should not apply' });
    expect(lockedRes.status).toBe(409);
  });

  it('soft-deletes a complaint so it no longer appears in listings or lookups', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .send(basePayload(department, category));
    const id = createRes.body.data.complaint._id;

    const deleteRes = await request(app).delete(`/api/v1/complaints/${id}`).set(authHeader(token));
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/complaints/${id}`).set(authHeader(token));
    expect(getRes.status).toBe(404);
  });

  it('finds a complaint by tracking id via the track endpoint', async () => {
    const { department, category } = await seedDeptAndCategory();
    const { token } = await createUser({ role: ROLES.CITIZEN });

    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set(authHeader(token))
      .send(basePayload(department, category));

    const res = await request(app)
      .get(`/api/v1/complaints/track/${createRes.body.data.complaint.complaintId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.complaint._id).toBe(createRes.body.data.complaint._id);
  });

  describe('search, filter and sort', () => {
    it('filters by priority and searches by title substring', async () => {
      const { department, category } = await seedDeptAndCategory();
      const { token } = await createUser({ role: ROLES.CITIZEN });

      await request(app)
        .post('/api/v1/complaints')
        .set(authHeader(token))
        .send({ ...basePayload(department, category), title: 'Pipeline burst', priority: 'High' });
      await request(app)
        .post('/api/v1/complaints')
        .set(authHeader(token))
        .send({ ...basePayload(department, category), title: 'Streetlight outage', priority: 'Low' });

      const priorityRes = await request(app)
        .get('/api/v1/complaints?priority=High')
        .set(authHeader(token));
      expect(priorityRes.body.data.total).toBe(1);
      expect(priorityRes.body.data.complaints[0].title).toBe('Pipeline burst');

      const searchRes = await request(app)
        .get('/api/v1/complaints?search=pipeline')
        .set(authHeader(token));
      expect(searchRes.body.data.total).toBe(1);
    });

    it('sorts by priority severity (Emergency first), not alphabetically', async () => {
      const { department, category } = await seedDeptAndCategory();
      const { token } = await createUser({ role: ROLES.CITIZEN });

      await request(app)
        .post('/api/v1/complaints')
        .set(authHeader(token))
        .send({ ...basePayload(department, category), title: 'Low priority issue', priority: 'Low' });
      await request(app)
        .post('/api/v1/complaints')
        .set(authHeader(token))
        .send({ ...basePayload(department, category), title: 'Urgent issue', priority: 'Emergency' });

      const res = await request(app).get('/api/v1/complaints?sort=priority').set(authHeader(token));

      expect(res.body.data.complaints.map((c) => c.priority)).toEqual(['Emergency', 'Low']);
    });

    it('rejects an invalid sort value with 422', async () => {
      const { token } = await createUser({ role: ROLES.CITIZEN });
      const res = await request(app)
        .get('/api/v1/complaints?sort=alphabetical')
        .set(authHeader(token));
      expect(res.status).toBe(422);
    });
  });
});
