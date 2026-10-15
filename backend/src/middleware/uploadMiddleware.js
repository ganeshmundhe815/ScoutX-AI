const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed video file extensions
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']);

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `football-${uniqueSuffix}${ext}`);
  },
});

// File Filter: Validates supported video extensions & mime types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isVideoMime = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';

  if (ALLOWED_VIDEO_EXTENSIONS.has(ext) || isVideoMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid video file format '${ext || file.mimetype}'. Supported formats: MP4, MOV, AVI, MKV, WEBM.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max size
  },
  fileFilter,
});

module.exports = upload;

