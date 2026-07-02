/**
 * Strips the extension and replaces anything that isn't a-z/A-Z/0-9/_/-
 * with an underscore, so user-supplied filenames can't inject path
 * separators or otherwise weird Cloudinary's public_id.
 */
function sanitizeFilename(name) {
  const withoutExt = name.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  return cleaned || 'file';
}

module.exports = sanitizeFilename;
