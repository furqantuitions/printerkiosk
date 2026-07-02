const multer = require('multer');
const path = require('path');

// Only formats LibreOffice can actually convert (plus PDF itself).
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc', '.docx', '.odt', '.rtf', '.txt',
  '.xls', '.xlsx', '.ods',
  '.ppt', '.pptx', '.odp',
  '.jpg', '.jpeg', '.png',
]);

// Files are kept in memory as buffers so we can convert/compress
// them before ever touching disk or Cloudinary.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Unsupported file type "${ext || 'unknown'}". Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  // Hard ceiling on the raw upload itself. Anything between this and
  // MAX_FILE_SIZE_MB (see pdfService) gets compressed automatically.
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB absolute cap
});

module.exports = upload;
