const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

// libreoffice-convert's convert() takes a callback AND also returns an
// internal (unusable) promise, which trips Node's util.promisify deprecation
// warning if wrapped directly. Wrapping it by hand avoids that noise.
function libreConvertAsync(buffer, ext, filter) {
  return new Promise((resolve, reject) => {
    libre.convert(buffer, ext, filter, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Converts any office/image file LibreOffice understands (doc, docx, xls,
 * xlsx, ppt, pptx, odt, jpg, png, txt, ...) into a PDF buffer.
 * If the file is already a PDF, it is returned untouched.
 *
 * NOTE: requires LibreOffice ("soffice") to be installed on the host.
 *   Ubuntu/Debian: apt-get install -y libreoffice
 */
async function convertToPdf(buffer, originalName) {
  const ext = path.extname(originalName).toLowerCase().replace('.', '');

  if (ext === 'pdf') {
    return buffer;
  }

  try {
    const pdfBuffer = await libreConvertAsync(buffer, '.pdf', undefined);
    return pdfBuffer;
  } catch (err) {
    throw new Error(`Failed to convert "${originalName}" to PDF: ${err.message}`);
  }
}

/**
 * Returns true if the PDF is encrypted / password protected.
 * pdf-lib throws when it hits an encrypted document unless
 * ignoreEncryption is passed, so we use that to detect it.
 */
async function checkPasswordProtected(buffer) {
  try {
    await PDFDocument.load(buffer); // no ignoreEncryption -> throws on encrypted files
    return false;
  } catch (err) {
    const msg = (err && err.message ? err.message : '').toLowerCase();
    if (msg.includes('encrypt')) {
      return true;
    }
    // Some other parsing problem - surface it instead of silently swallowing
    throw new Error(`Unable to read PDF structure: ${err.message}`);
  }
}

/**
 * Page count. Uses ignoreEncryption so this still works even if a caller
 * wants the count for an encrypted file (the upload flow itself rejects
 * password-protected files before this is ever needed for those files).
 */
async function getPageCount(buffer) {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Compresses a PDF using Ghostscript's /ebook quality preset.
 * NOTE: requires Ghostscript ("gs") to be installed on the host.
 *   Ubuntu/Debian: apt-get install -y ghostscript
 */
function compressPdfBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const inputPath = path.join(tmpDir, `in-${stamp}.pdf`);
    const outputPath = path.join(tmpDir, `out-${stamp}.pdf`);

    fs.writeFile(inputPath, buffer, (writeErr) => {
      if (writeErr) return reject(writeErr);

      const cmd = [
        'gs',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile="${outputPath}"`,
        `"${inputPath}"`,
      ].join(' ');

      exec(cmd, (execErr) => {
        const cleanup = () => {
          fs.unlink(inputPath, () => {});
          fs.unlink(outputPath, () => {});
        };

        if (execErr) {
          cleanup();
          return reject(new Error(`PDF compression failed: ${execErr.message}`));
        }

        fs.readFile(outputPath, (readErr, compressed) => {
          cleanup();
          if (readErr) return reject(readErr);
          resolve(compressed);
        });
      });
    });
  });
}

module.exports = {
  convertToPdf,
  checkPasswordProtected,
  getPageCount,
  compressPdfBuffer,
};
