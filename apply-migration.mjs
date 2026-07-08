/**
 * apply-migration.mjs
 * Run this once to apply the PGVector schema to your Supabase project.
 * Usage: node apply-migration.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
 * (or set them directly below for a one-off run).
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  Missing env vars. Please set:");
  console.error("    SUPABASE_URL");
  console.error("    SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Run individual SQL statements ─────────────────────────────────────────

async function sql(statement, label) {
  console.log(`\n⏳  ${label}…`);
  const { error } = await supabase.rpc("exec_sql", { sql: statement });
  if (error) {
    // Try direct REST query endpoint as fallback
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql: statement }),
    });
    if (!res.ok) {
      const text = await res.text();
      // If it's "already exists" that's fine — idempotent
      if (text.includes("already exists")) {
        console.log(`   ⚠️  Already exists — skipping.`);
        return;
      }
      console.error(`   ❌  Error: ${text}`);
      return;
    }
    console.log(`   ✅  Done`);
    return;
  }
  console.log(`   ✅  Done`);
}

// ── Verification queries ────────────────────────────────────────────────

async function verify() {
  console.log("\n\n🔍  Verifying schema…\n");

  // 1. pgvector extension
  const { data: ext } = await supabase
    .from("pg_extension")
    .select("extname")
    .eq("extname", "vector")
    .maybeSingle();
  console.log(`  pgvector extension:           ${ext ? "✅  enabled" : "❌  NOT found"}`);

  // 2. document_chunks table
  const { data: tbl } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_name", "document_chunks")
    .maybeSingle();
  console.log(`  document_chunks table:        ${tbl ? "✅  exists" : "❌  NOT found"}`);

  // 3. full_text column on documents
  const { data: col } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name",   "documents")
    .eq("column_name",  "full_text")
    .maybeSingle();
  console.log(`  full_text column (documents): ${col ? "✅  exists" : "❌  NOT found"}`);

  // 4. match_document_chunks function
  const { data: fn } = await supabase
    .from("information_schema.routines")
    .select("routine_name")
    .eq("routine_schema", "public")
    .eq("routine_name",   "match_document_chunks")
    .maybeSingle();
  console.log(`  match_document_chunks fn:     ${fn ? "✅  exists" : "❌  NOT found"}`);
}

await verify();

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTE: The Supabase REST API does not allow running arbitrary
DDL through the JS client. To apply the migration, please
run the SQL in your Supabase Dashboard → SQL Editor.
The migration file is at:
  supabase/migrations/20260709000000_pgvector_document_chunks.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
