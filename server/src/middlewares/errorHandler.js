import env from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof ApiError ? err.errors : [];

  if (env.nodeEnv === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
