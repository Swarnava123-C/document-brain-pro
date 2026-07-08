import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mwfaszxovnutrmzpesor.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Jp0wH4ftUQkrXSXTyYZfFQ_7qgMFDSE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking if migration was applied...");
  
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id")
    .limit(1);
    
  if (error) {
    console.error("Migration NOT applied or error:", error.message);
  } else {
    console.log("SUCCESS: document_chunks table exists! Migration was applied.");
  }
}

check();
