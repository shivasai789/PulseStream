const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// On Vercel (and similar serverless), filesystem is read-only except /tmp.
const isServerless = process.env.VERCEL === '1';
const UPLOAD_DIR = isServerless
  ? path.join('/tmp', 'videos')
  : (process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), 'uploads', 'videos'));
const VIDEO_MAX_SIZE = Number(process.env.VIDEO_MAX_SIZE) || 500 * 1024 * 1024; // 500MB

const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',  // .mov
  'video/x-msvideo',  // .avi
  'video/x-matroska', // .mkv
];

const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.mp4';
    const name = `${crypto.randomUUID()}${safeExt}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: VIDEO_MAX_SIZE },
});

module.exports = { upload, UPLOAD_DIR, VIDEO_MAX_SIZE };
