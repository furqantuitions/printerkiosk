require('dotenv').config();

const REQUIRED_VARS = [
  'API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FIREBASE_DATABASE_URL',
  'JAZZCASH_MERCHANT_ID',
  'JAZZCASH_PASSWORD',
  'JAZZCASH_INTEGRITY_SALT',
  'JAZZCASH_API_URL',
];

/**
 * Throws with a clear message listing everything missing, instead of
 * letting the app boot into a broken state and fail confusingly on the
 * first real request.
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  // Firebase creds can come from either a JSON env var (cloud deploys) or a
  // file path (local dev) - at least one must be set.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON');
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
