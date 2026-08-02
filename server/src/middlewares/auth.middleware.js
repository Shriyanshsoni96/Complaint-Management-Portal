import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAuthToken } from '../utils/verifyAuthToken.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = await verifyAuthToken(token);
  } catch {
    throw new ApiError(401, 'Not authorized, invalid or expired token');
  }

  next();
});

export function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}
