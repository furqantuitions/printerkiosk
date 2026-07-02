const db = require('../config/firebase');

/**
 * Saves a file record keyed by the random 6-digit number.
 * Shape: files/{number} => { number, url, pages, timestamp, billed }
 */
async function saveFileRecord({ number, url, pages, timestamp }) {
  const record = { number, url, pages, timestamp, billed: false };
  await db.ref(`files/${number}`).set(record);
  return record;
}

async function getFileRecordByNumber(number) {
  const snapshot = await db.ref(`files/${number}`).once('value');
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Marks a file as billed so the same code can't be charged twice.
 * paymentController checks record.billed before calling this.
 */
async function markAsBilled(number, txnRefNo) {
  await db.ref(`files/${number}`).update({
    billed: true,
    billedAt: Date.now(),
    txnRefNo,
  });
}

module.exports = { saveFileRecord, getFileRecordByNumber, markAsBilled };
