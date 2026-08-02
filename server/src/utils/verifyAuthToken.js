import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

// Shared by the HTTP `protect` middleware and the Socket.IO connection
// middleware so both authenticate JWTs and load the user the same way.
export async function verifyAuthToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  return user;
}
