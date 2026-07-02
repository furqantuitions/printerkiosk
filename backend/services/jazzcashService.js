const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

function formatDateTime(date) {
  return date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function generateTxnRefNo() {
  return `T${formatDateTime(new Date())}${Math.floor(Math.random() * 1000)}`;
}

/**
 * JazzCash requires a HMAC-SHA256 hash of all pp_ fields (sorted
 * alphabetically by key, values joined with "&"), prefixed with the
 * Integrity Salt, using the Integrity Salt as the HMAC key.
 */
function generateSecureHash(params, integritySalt) {
  const sortedKeys = Object.keys(params).sort();
  const joinedValues = sortedKeys.map((key) => params[key]).join('&');
  const hashInput = `${integritySalt}&${joinedValues}`;
  return crypto.createHmac('sha256', integritySalt).update(hashInput).digest('hex');
}

/**
 * Creates a Mobile Wallet (MA) transaction against JazzCash's merchant API.
 * amountPkr is converted to paisa (JazzCash expects amount * 100).
 */
async function createMobileWalletTransaction({ mobileNumber, cnicLast6, amountPkr, billReference }) {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
  const returnUrl = process.env.JAZZCASH_RETURN_URL;
  const apiUrl = process.env.JAZZCASH_API_URL;

  if (!merchantId || !password || !integritySalt || !apiUrl) {
    throw new Error('JazzCash credentials are not configured. Check your .env file.');
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const amountInPaisa = Math.round(amountPkr * 100).toString();

  const params = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: generateTxnRefNo(),
    pp_Amount: amountInPaisa,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatDateTime(now),
    pp_BillReference: billReference || 'pdfPageCharges',
    pp_Description: 'PDF page processing charges',
    pp_TxnExpiryDateTime: formatDateTime(expiry),
    pp_ReturnURL: returnUrl,
    pp_MobileNumber: mobileNumber,
    pp_CNIC: cnicLast6,
  };

  params.pp_SecureHash = generateSecureHash(params, integritySalt);

  const response = await axios.post(apiUrl, params, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000, // don't let a hung gateway hold the request open forever
  });

  return response.data;
}

module.exports = { createMobileWalletTransaction, generateSecureHash };
