const generateRandom6Digit = require('../utils/randomNumber');
const sanitizeFilename = require('../utils/sanitizeFilename');
const {
  convertToPdf,
  checkPasswordProtected,
  getPageCount,
  compressPdfBuffer,
} = require('../services/pdfService');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { saveFileRecord, getFileRecordByNumber } = require('../services/firebaseService');
const logger = require('../utils/logger');

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 30) * 1024 * 1024;
const PRICE_PER_PAGE = parseInt(process.env.PRICE_PER_PAGE_PKR, 10) || 10;

async function getUniqueNumber() {
  let number;
  let existing;
  do {
    number = generateRandom6Digit();
    existing = await getFileRecordByNumber(number);
  } while (existing);
  return number;
}

async function uploadFile(req, res, next) {
  const log = req.log || logger;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded (field name must be "file")' });
    }

    let buffer = req.file.buffer;
    const originalName = req.file.originalname;

    log.info({ originalName, sizeBytes: buffer.length }, 'Upload received');

    // 1. Convert to PDF (no-op if already a PDF)
    buffer = await convertToPdf(buffer, originalName);

    // 2. Reject password-protected PDFs
    const isProtected = await checkPasswordProtected(buffer);
    if (isProtected) {
      return res.status(422).json({
        success: false,
        message: 'File is password protected. Remove the password and try again.',
      });
    }

    // 3. Compress if over the size threshold
    if (buffer.length > MAX_SIZE_BYTES) {
      const beforeSize = buffer.length;
      buffer = await compressPdfBuffer(buffer);
      log.info({ beforeSize, afterSize: buffer.length }, 'Compressed oversized PDF');
      if (buffer.length > MAX_SIZE_BYTES) {
        return res.status(413).json({
          success: false,
          message: `File is still over ${MAX_SIZE_BYTES / (1024 * 1024)}MB after compression`,
        });
      }
    }

    // 4. Page count
    const pages = await getPageCount(buffer);

    // 5. Unique random 6-digit identifier
    const number = await getUniqueNumber();

    // 6. Upload to Cloudinary (filename sanitized to keep public_id safe)
    const safeName = sanitizeFilename(originalName);
    const cloudinaryResult = await uploadBufferToCloudinary(buffer, `${number}-${safeName}`);

    // 7. Persist to Firebase Realtime DB
    const timestamp = Date.now();
    const record = await saveFileRecord({ number, url: cloudinaryResult.secure_url, pages, timestamp });

    log.info({ number, pages }, 'Upload processed successfully');

    return res.status(201).json({
      success: true,
      data: {
        ...record,
        amountDuePkr: pages * PRICE_PER_PAGE,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getFileByNumber(req, res, next) {
  try {
    const { number } = req.params;

    if (!/^\d{6}$/.test(number)) {
      return res.status(400).json({ success: false, message: 'Number must be exactly 6 digits' });
    }

    const record = await getFileRecordByNumber(number);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No file found for this number' });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile, getFileByNumber };
