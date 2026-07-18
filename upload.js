// upload.js — Multer storage config + image compression helper.
// Images are auto-compressed with sharp on upload. Videos/PDFs are stored as-is.

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_ROOT = path.join(__dirname, 'uploads', 'projects');
const CATEGORIES = ['hero', 'before', 'during', 'after', 'gallery', 'videos', 'pdfs'];

CATEGORIES.forEach((c) => {
  const dir = path.join(UPLOAD_ROOT, c);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = CATEGORIES.includes(req.params.category) ? req.params.category : 'gallery';
    cb(null, path.join(UPLOAD_ROOT, category));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const maxMB = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|mp4|webm|mov|pdf/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) return cb(null, true);
  cb(new Error('Unsupported file type: ' + ext));
};

const upload = multer({
  storage,
  limits: { fileSize: maxMB * 1024 * 1024 },
  fileFilter,
});

// Compresses an uploaded image in place (JPEG/PNG/WebP only). Videos/PDFs pass through.
async function compressIfImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return filePath;

  const tmpPath = filePath + '.tmp';
  await sharp(filePath)
    .rotate() // respect EXIF orientation
    .resize({ width: 2400, withoutEnlargement: true })
    .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: 82, mozjpeg: true })
    .toFile(tmpPath);

  fs.renameSync(tmpPath, filePath);
  return filePath;
}

module.exports = { upload, compressIfImage, CATEGORIES, UPLOAD_ROOT };
