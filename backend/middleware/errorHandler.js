const multer = require('multer');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File exceeds the 100MB hard limit' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // Thrown by upload.js's fileFilter for disallowed file types.
  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    (req.log || logger).error({ err, path: req.path, method: req.method }, 'Unhandled request error');
  } else {
    (req.log || logger).warn({ path: req.path, method: req.method, message: err.message }, 'Request failed');
  }

  return res.status(status).json({
    success: false,
    // Don't leak internal error details/stack traces to clients in production.
    message: isProd && status >= 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;
