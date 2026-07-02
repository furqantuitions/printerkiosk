# Cloud PDF Service

Upload any document → convert to PDF → auto-compress if >30MB → reject if
password-protected → count pages → store on Cloudinary → track in Firebase
Realtime DB under a random 6-digit code → bill the user via JazzCash Mobile
Wallet at PKR 10/page → look the file back up by that code.

## 1. System dependencies (install on the server, not via npm)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libreoffice ghostscript
```

- **LibreOffice** (`soffice`) — used by `libreoffice-convert` to turn doc,
  docx, xls, xlsx, ppt, pptx, images, etc. into PDF.
- **Ghostscript** (`gs`) — used to compress PDFs over the size threshold.

Without these two binaries on PATH, conversion/compression calls will fail.

## 2. Install & configure

```bash
npm install
cp .env.example .env   # then fill in the values below
```

- **Cloudinary**: cloud name / API key / API secret from your Cloudinary dashboard.
- **Firebase**: create a Realtime Database, download a service account JSON
  key. For local dev, save it (e.g. as `serviceAccountKey.json`) and point
  `FIREBASE_SERVICE_ACCOUNT_PATH` at it. For cloud deploys, paste the whole
  JSON into `FIREBASE_SERVICE_ACCOUNT_JSON` instead (it takes priority if both
  are set). Set `FIREBASE_DATABASE_URL` to your database's URL.
- **JazzCash**: merchant ID, password and integrity salt come from your
  JazzCash merchant onboarding. `JAZZCASH_API_URL` defaults to the sandbox
  Mobile Wallet endpoint — swap to the production URL when you go live.
- **API_KEY**: make up any long random string (e.g. `openssl rand -hex 32`).
  Every client calling this API must send it as the `x-api-key` header.

## 3. Run

```bash
npm run dev   # nodemon
# or
npm start
```

## 4. Deploying with Docker

A `Dockerfile` is included that bundles Node + LibreOffice + Ghostscript, so
you don't need to install system packages on the host separately.

```bash
docker build -t cloud-pdf-service .
docker run -d -p 5000:5000 --env-file .env cloud-pdf-service
```

For PaaS platforms (Railway, Render, Fly.io) that build from a `Dockerfile`
automatically: push to GitHub, connect the repo, and set all the `.env.example`
variables in the platform's dashboard (use `FIREBASE_SERVICE_ACCOUNT_JSON`
instead of a file path — most platforms give you an env var UI, not a file
upload). Note the image is large (LibreOffice is ~500MB+), so builds can take
a few minutes and cold starts after idling can take a few seconds.

## 5. API Reference

All endpoints require an `x-api-key: <your API_KEY>` header.

### POST `/api/files/upload`
`multipart/form-data`, field name **`file`**.

Pipeline: convert → password check → compress (if >30MB) → page count →
generate unique 6-digit code → upload to Cloudinary → save record to
Firebase.

**Success (201):**
```json
{
  "success": true,
  "data": {
    "number": "482913",
    "url": "https://res.cloudinary.com/.../482913-report.pdf",
    "pages": 12,
    "timestamp": 1751443200000,
    "amountDuePkr": 120
  }
}
```

**Password-protected file (422):**
```json
{ "success": false, "message": "File is password protected. Remove the password and try again." }
```

**Still too large after compression (413):**
```json
{ "success": false, "message": "File is still over 30MB after compression" }
```

### GET `/api/files/:number`
Looks up a stored file by its 6-digit code.

```json
{
  "success": true,
  "data": { "number": "482913", "url": "https://...", "pages": 12, "timestamp": 1751443200000 }
}
```
Returns `404` if the code doesn't exist.

### POST `/api/payment/bill`
Body:
```json
{
  "number": "482913",
  "mobileNumber": "03001234567",
  "cnicLast6": "123456"
}
```

Looks up the file's page count in Firebase, computes
`pages * PRICE_PER_PAGE_PKR`, and fires a JazzCash Mobile Wallet transaction
for that amount.

```json
{
  "success": true,
  "number": "482913",
  "pages": 12,
  "pricePerPagePkr": 10,
  "amountPkr": 120,
  "jazzCashResponse": { "...": "raw response from JazzCash" }
}
```

## 6. Production hardening in this version

- **Auth**: every route requires an `x-api-key` header matching `API_KEY` in your env. Missing/wrong key → `401`.
- **Rate limiting**: 200 req/15min globally, 30 uploads/hour per IP (uploads are the expensive path — LibreOffice + Ghostscript + Cloudinary).
- **File-type allowlist**: `middleware/upload.js` only accepts extensions LibreOffice can actually convert (pdf, doc/docx, odt, rtf, txt, xls/xlsx, ods, ppt/pptx, odp, jpg, png). Anything else is rejected before it ever reaches LibreOffice.
- **Double-billing protection**: each Firebase record has a `billed` flag. `/api/payment/bill` returns `409 Conflict` if the file was already billed, and only flips it to `true` after JazzCash confirms success (`pp_ResponseCode === '000'`).
- **Input validation**: `mobileNumber` must match `03XXXXXXXXX`, `cnicLast6` must be exactly 6 digits, `number` must be exactly 6 digits — all validated before anything hits Firebase or JazzCash.
- **Filename sanitization**: original filenames are stripped down to safe characters before being used in Cloudinary's `public_id`.
- **Security headers**: `helmet()` is applied globally.
- **CORS**: configurable via `ALLOWED_ORIGINS`; defaults to `*` if unset.
- **Structured logging**: `pino` + `pino-http` — JSON logs in production (for log aggregators), pretty-printed locally. Every request/response is logged with a request id.
- **Fail-fast startup**: `config/env.js` checks all required env vars exist before the server binds to a port — a misconfigured deploy fails immediately with a clear message instead of crashing confusingly on the first real request.
- **Graceful shutdown**: `SIGTERM`/`SIGINT` drain in-flight requests before exiting (important for zero-downtime deploys on most PaaS).
- **Crash safety**: `uncaughtException` and `unhandledRejection` are logged before the process exits, instead of silently limping along in a broken state.
- **No leaked internals**: in `NODE_ENV=production`, 5xx error responses return a generic message — stack traces and internal error text never reach the client (they're still logged server-side).
- **Request timeout on JazzCash calls**: 15s axios timeout so a hung payment gateway can't hold your server's connections open indefinitely.

### Still worth adding before a real launch, depending on your needs

- **Per-user auth** instead of one shared API key, if end users hit this API directly rather than through your own backend/frontend.
- **JazzCash return/callback endpoint** — right now `JAZZCASH_RETURN_URL` is configured but no route handles it. You'll want `POST /api/payment/callback` to verify JazzCash's `pp_SecureHash` on the callback and reconcile the transaction server-side (don't trust the client-side response alone for anything money-related).
- **Firebase security rules** — the Realtime Database itself should have rules restricting reads/writes to your service account, independent of this app's own auth.
- **Automated tests** — none are included; consider adding integration tests for the upload pipeline and payment idempotency logic.
- **Centralized log shipping** (e.g. to Datadog/CloudWatch/Better Stack) — pino's JSON output in production is ready for this, just needs a shipper configured on your host.
