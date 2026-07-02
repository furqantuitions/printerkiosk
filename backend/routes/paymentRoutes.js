const express = require('express');
const router = express.Router();

const apiKeyAuth = require('../middleware/auth');
const { billForFile } = require('../controllers/paymentController');

// POST /api/payment/bill
router.post('/bill', apiKeyAuth, billForFile);

module.exports = router;
