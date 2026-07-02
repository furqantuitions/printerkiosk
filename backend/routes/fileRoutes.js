const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const apiKeyAuth = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadFile, getFileByNumber } = require('../controllers/fileController');

// POST /api/files/upload   (multipart/form-data, field name: "file")
router.post('/upload', apiKeyAuth, uploadLimiter, upload.single('file'), uploadFile);

// GET /api/files/:number   (6-digit lookup code)
router.get('/:number', apiKeyAuth, getFileByNumber);

module.exports = router;
