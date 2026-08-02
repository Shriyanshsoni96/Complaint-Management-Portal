import crypto from 'crypto';

export function generateComplaintId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CMP-${datePart}-${randomPart}`;
}
