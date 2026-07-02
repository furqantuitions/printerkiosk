const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

/**
 * Streams a PDF buffer straight to Cloudinary without touching disk.
 * resource_type "raw" is required for non-image files like PDFs.
 */
function uploadBufferToCloudinary(buffer, publicName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'pdf_uploads',
        public_id: publicName.replace(/\.[^/.]+$/, ''),
        format: 'pdf',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { uploadBufferToCloudinary };
