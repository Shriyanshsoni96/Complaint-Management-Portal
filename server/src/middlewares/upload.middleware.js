import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'src/uploads/complaints'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new ApiError(422, 'Only image files (jpeg, png, webp, gif) are allowed'));
    return;
  }
  cb(null, true);
}

const uploadComplaintImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
}).array('images', MAX_FILES);

export function handleComplaintImageUpload(req, res, next) {
  uploadComplaintImages(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(422, 'Each image must be smaller than 5MB'));
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        next(new ApiError(422, 'You can upload a maximum of 5 images'));
        return;
      }
      next(new ApiError(422, err.message));
      return;
    }

    next(err);
  });
}
