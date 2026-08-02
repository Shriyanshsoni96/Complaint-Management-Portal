// Optional demo data for local development / classroom demonstrations only.
// Reuses the real service layer (not raw model writes) so seeded data behaves
// exactly like data created through the app: timeline entries, notifications,
// and complaint IDs are all generated the same way a real user's actions would.
import mongoose from 'mongoose';
import connectDB from '../database/connection.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Category from '../models/Category.js';
import { ROLES } from '../constants/roles.js';
import * as adminService from '../services/admin.service.js';
import * as complaintService from '../services/complaint.service.js';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';

const DEPARTMENTS = [
  {
    departmentName: 'Water Supply Department',
    categories: ['Pipeline Leak', 'No Water Supply'],
    officer: { name: 'Demo Officer - Water', email: 'officer.water@demo.cmp', phone: '9000000001' },
  },
  {
    departmentName: 'Roads & Infrastructure',
    categories: ['Pothole', 'Broken Footpath'],
    officer: { name: 'Demo Officer - Roads', email: 'officer.roads@demo.cmp', phone: '9000000002' },
  },
  {
    departmentName: 'Electricity Department',
    categories: ['Power Outage', 'Damaged Transformer'],
    officer: { name: 'Demo Officer - Electricity', email: 'officer.electricity@demo.cmp', phone: '9000000003' },
  },
];

const CITIZENS = [
  { name: 'Demo Citizen One', email: 'citizen.one@demo.cmp', phone: '9111111111' },
  { name: 'Demo Citizen Two', email: 'citizen.two@demo.cmp', phone: '9222222222' },
];

async function findOrCreateUser({ name, email, phone, role, department }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, password: DEMO_PASSWORD, phone, role, department });
}

async function seedDemoData() {
  await connectDB();

  const alreadySeeded = await Department.findOne({ departmentName: DEPARTMENTS[0].departmentName });
  if (alreadySeeded) {
    console.log('Demo data seeding skipped: demo departments already exist.');
    console.log('  If you want a fresh set, drop the database (or the relevant collections) first.');
    return;
  }

  const admin = await User.findOne({ role: ROLES.ADMIN });
  if (!admin) {
    console.log('Demo data seeding aborted: no Admin account exists yet.');
    console.log('  Run "npm run seed:admin" first, then rerun "npm run seed:demo".');
    return;
  }

  console.log('Seeding demo departments, categories, and officers...');
  const departmentDocs = [];
  for (const dept of DEPARTMENTS) {
    const departmentDoc = await Department.create({ departmentName: dept.departmentName });
    const categoryDocs = await Promise.all(
      dept.categories.map((categoryName) =>
        Category.create({ categoryName, department: departmentDoc._id }),
      ),
    );
    const officer = await findOrCreateUser({
      ...dept.officer,
      role: ROLES.OFFICER,
      department: departmentDoc._id,
    });
    departmentDocs.push({ department: departmentDoc, categories: categoryDocs, officer });
    console.log(`  Created department "${departmentDoc.departmentName}" with ${categoryDocs.length} categories and 1 officer.`);
  }

  console.log('Seeding demo citizens...');
  const citizenDocs = await Promise.all(
    CITIZENS.map((citizen) => findOrCreateUser({ ...citizen, role: ROLES.CITIZEN })),
  );
  console.log(`  Created ${citizenDocs.length} citizen accounts.`);

  console.log('Seeding demo complaints (submitted -> assigned -> in progress -> resolved)...');

  // 1. A brand-new, untouched complaint (status: Pending).
  await complaintService.createComplaint(
    {
      title: 'Water leaking from main pipeline',
      description: 'A large pipeline near the community park has been leaking for two days, flooding the street.',
      category: departmentDocs[0].categories[0]._id.toString(),
      department: departmentDocs[0].department._id.toString(),
      priority: 'High',
      address: '12 Park Road',
      city: 'Springfield',
      state: 'IL',
    },
    [],
    citizenDocs[0],
  );

  // 2. A complaint that gets assigned to an officer (status: Assigned).
  const assignedSeed = await complaintService.createComplaint(
    {
      title: 'Large pothole on Main Street',
      description: 'A deep pothole near the Main Street intersection is damaging vehicles.',
      category: departmentDocs[1].categories[0]._id.toString(),
      department: departmentDocs[1].department._id.toString(),
      priority: 'Medium',
      address: 'Main Street & 5th Ave',
      city: 'Springfield',
      state: 'IL',
    },
    [],
    citizenDocs[1],
  );
  await adminService.assignComplaint(
    assignedSeed._id.toString(),
    { officerId: departmentDocs[1].officer._id.toString(), departmentId: departmentDocs[1].department._id.toString() },
    admin._id,
  );

  // 3. A complaint that's assigned and already In Progress.
  const inProgressSeed = await complaintService.createComplaint(
    {
      title: 'Power outage across three blocks',
      description: 'No electricity since last night across three residential blocks.',
      category: departmentDocs[2].categories[0]._id.toString(),
      department: departmentDocs[2].department._id.toString(),
      priority: 'Emergency',
      address: '45 Elm Street',
      city: 'Springfield',
      state: 'IL',
    },
    [],
    citizenDocs[0],
  );
  await adminService.assignComplaint(
    inProgressSeed._id.toString(),
    { officerId: departmentDocs[2].officer._id.toString(), departmentId: departmentDocs[2].department._id.toString() },
    admin._id,
  );
  await complaintService.updateComplaintStatus(inProgressSeed._id.toString(), departmentDocs[2].officer._id, {
    status: 'In Progress',
    remarks: 'Crew dispatched to inspect the transformer.',
  });

  // 4. A fully Resolved complaint, for dashboard/analytics variety.
  const resolvedSeed = await complaintService.createComplaint(
    {
      title: 'No water supply for two days',
      description: 'The whole street has had no water supply since Monday.',
      category: departmentDocs[0].categories[1]._id.toString(),
      department: departmentDocs[0].department._id.toString(),
      priority: 'High',
      address: '78 River Lane',
      city: 'Springfield',
      state: 'IL',
    },
    [],
    citizenDocs[1],
  );
  await adminService.assignComplaint(
    resolvedSeed._id.toString(),
    { officerId: departmentDocs[0].officer._id.toString(), departmentId: departmentDocs[0].department._id.toString() },
    admin._id,
  );
  await complaintService.updateComplaintStatus(resolvedSeed._id.toString(), departmentDocs[0].officer._id, {
    status: 'In Progress',
    remarks: 'Identified a burst valve, repair in progress.',
  });
  await complaintService.updateComplaintStatus(resolvedSeed._id.toString(), departmentDocs[0].officer._id, {
    status: 'Resolved',
    remarks: 'Valve replaced, water supply restored.',
  });

  console.log('  Created 4 demo complaints across Pending, Assigned, In Progress, and Resolved states.');
  console.log('  Notifications and complaint timelines were generated automatically by the normal app logic.');
  console.log('\nDemo data seeding complete.');
  console.log(`  Demo citizen/officer login password: ${DEMO_PASSWORD}`);
}

seedDemoData()
  .catch((error) => {
    console.error('Demo data seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
