import { createClient } from "@supabase/supabase-js";

function isNewSupabaseApiKey(value) {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

async function run() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const sb = createClient(url, key, { global: { fetch: createSupabaseFetch(key) } });
  
  const { data: mData, error: mErr } = await sb.from('copilot_messages').select('*');
  console.log("copilot_messages with anon/pub key:", mErr ? mErr.message : `OK (${mData?.length} rows)`);
  if (mData && mData.length > 0) {
    console.log("Sample message:", mData[mData.length - 1]);
  }
}

run();
