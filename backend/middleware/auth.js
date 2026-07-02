/**
 * Simple shared-secret API key auth. Client must send:
 *   x-api-key: <API_KEY from your .env>
 *
 * Good enough for a service-to-service backend. If you later have real end
 * users hitting this directly (not just your own frontend/server), swap
 * this for per-user JWTs instead of one shared key.
 */
function apiKeyAuth(req, res, next) {
  const providedKey = req.header('x-api-key');

  if (!providedKey || providedKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, message: 'Missing or invalid API key' });
  }

  next();
}

module.exports = apiKeyAuth;
