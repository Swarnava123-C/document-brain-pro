import { createClient } from "@supabase/supabase-js";

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(url, key);
  
  const mockVector = Array.from({length: 768}, (_, i) => Math.sin(1234 + i * 0.1) * 0.1);
  const { data, error } = await sb.rpc('match_document_chunks', {
    query_embedding: mockVector,
    match_threshold: 0.1,
    match_count: 10
  });
  console.log("RPC match_document_chunks:", error ? error.message : `OK (${data?.length} chunks matched)`);
  
  const { data: chunks, error: cErr } = await sb.from('document_chunks').select('id, document_id, chunk_index, content');
  console.log("document_chunks table rows:", cErr ? cErr.message : `OK (${chunks?.length} rows)`);
}

run();
