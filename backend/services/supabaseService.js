const supabase = require('../config/supabase');

/**
 * Uploads a buffer to Supabase Storage under the given key and returns
 * its public URL.
 *
 * NOTE: getPublicUrl() only returns a working link if the bucket is set
 * to "Public" in Supabase Storage settings. If you'd rather keep the
 * bucket private, swap the getPublicUrl() call below for:
 *   const { data, error } = await supabase.storage.from(bucket)
 *     .createSignedUrl(key, 60 * 60 * 24 * 365); // e.g. 1 year expiry
 * and store data.signedUrl instead.
 */
async function uploadBufferToSupabase(buffer, key) {
  const bucket = process.env.SUPABASE_BUCKET_NAME;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);

  return { url: data.publicUrl, key };
}

module.exports = { uploadBufferToSupabase };
