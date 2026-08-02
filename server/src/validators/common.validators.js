import { param } from 'express-validator';

export function mongoIdParam(field = 'id') {
  return [param(field).isMongoId().withMessage(`Invalid ${field}`)];
}
