const rateLimit = require('express-rate-limit');

// Applies to every request as a broad abuse guard.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Tighter limit specifically on uploads since they're the expensive path
// (LibreOffice conversion + Ghostscript compression + Cloudinary upload).
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached, please try again in a bit' },
});

module.exports = { generalLimiter, uploadLimiter };
