const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Uses the service role key (not the anon key) since this is a trusted
// backend that needs to write to storage regardless of RLS policies.
// Never expose this key to a client/frontend.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;
