import User from '../../src/models/User.js';
import { generateToken } from '../../src/utils/generateToken.js';
import { ROLES } from '../../src/constants/roles.js';

let counter = 0;

export async function createUser({ role = ROLES.CITIZEN, ...overrides } = {}) {
  counter += 1;
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user${Date.now()}${counter}@example.com`,
    password: overrides.password || 'Password123',
    phone: overrides.phone || '9876543210',
    role,
    ...overrides,
  });
  const token = generateToken({ id: user._id, role: user.role });
  return { user, token };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
