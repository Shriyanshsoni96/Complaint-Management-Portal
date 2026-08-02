import mongoose from 'mongoose';
import connectDB from '../database/connection.js';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';

const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@cmp.local').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '9999999999';

async function seedAdmin() {
  await connectDB();

  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
  if (existingAdmin) {
    console.log('Admin seeding skipped: an Admin account already exists.');
    console.log(`  Existing admin email: ${existingAdmin.email}`);
    console.log('  Set a different ADMIN_EMAIL if you intentionally need another admin.');
    return;
  }

  const emailTaken = await User.findOne({ email: ADMIN_EMAIL });
  if (emailTaken) {
    console.log(
      `Admin seeding skipped: a user with email "${ADMIN_EMAIL}" already exists (role: ${emailTaken.role}).`,
    );
    console.log('  Set ADMIN_EMAIL to an unused address and rerun this script.');
    return;
  }

  // password is hashed automatically by the User model's pre('save') hook.
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    phone: ADMIN_PHONE,
    role: ROLES.ADMIN,
  });

  console.log('Admin account created successfully.');
  console.log(`  Name:     ${admin.name}`);
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('  Log in with these credentials and change the password immediately.');
}

seedAdmin()
  .catch((error) => {
    console.error('Admin seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
