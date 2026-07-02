const { getFileRecordByNumber, markAsBilled } = require('../services/firebaseService');
const { createMobileWalletTransaction } = require('../services/jazzcashService');
const logger = require('../utils/logger');

const PRICE_PER_PAGE = parseInt(process.env.PRICE_PER_PAGE_PKR, 10) || 10;

const NUMBER_RE = /^\d{6}$/;
const MOBILE_RE = /^03\d{9}$/; // Pakistani mobile format, e.g. 03001234567
const CNIC_LAST6_RE = /^\d{6}$/;

/**
 * Body: { number, mobileNumber, cnicLast6 }
 *   number       - the 6-digit id returned by the upload endpoint
 *   mobileNumber - JazzCash-registered mobile number, e.g. "03001234567"
 *   cnicLast6    - last 6 digits of the payer's CNIC
 */
async function billForFile(req, res, next) {
  try {
    const { number, mobileNumber, cnicLast6 } = req.body;

    if (!number || !mobileNumber || !cnicLast6) {
      return res.status(400).json({
        success: false,
        message: 'number, mobileNumber and cnicLast6 are all required',
      });
    }
    if (!NUMBER_RE.test(number)) {
      return res.status(400).json({ success: false, message: 'number must be exactly 6 digits' });
    }
    if (!MOBILE_RE.test(mobileNumber)) {
      return res.status(400).json({ success: false, message: 'mobileNumber must look like 03XXXXXXXXX' });
    }
    if (!CNIC_LAST6_RE.test(cnicLast6)) {
      return res.status(400).json({ success: false, message: 'cnicLast6 must be exactly 6 digits' });
    }

    const record = await getFileRecordByNumber(number);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No file found for this number' });
    }

    // Prevent charging the same file twice.
    if (record.billed) {
      return res.status(409).json({
        success: false,
        message: 'This file has already been billed',
        billedAt: record.billedAt,
      });
    }

    const amountPkr = record.pages * PRICE_PER_PAGE;

    const jazzCashResponse = await createMobileWalletTransaction({
      mobileNumber,
      cnicLast6,
      amountPkr,
      billReference: number,
    });

    // Only mark as billed once JazzCash actually confirms success.
    // pp_ResponseCode "000" is JazzCash's documented success code.
    if (jazzCashResponse && jazzCashResponse.pp_ResponseCode === '000') {
      await markAsBilled(number, jazzCashResponse.pp_TxnRefNo);
    } else {
      (req.log || logger).warn({ number, jazzCashResponse }, 'JazzCash transaction did not confirm success');
    }

    return res.json({
      success: true,
      number,
      pages: record.pages,
      pricePerPagePkr: PRICE_PER_PAGE,
      amountPkr,
      jazzCashResponse,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { billForFile };
