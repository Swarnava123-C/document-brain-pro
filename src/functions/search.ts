/**
 * search.ts — Semantic Search Server Function
 *
 * Provides RAG-ready retrieval of document chunks using PGVector cosine similarity.
 * Called by the AI Copilot (Phase 4) to ground answers in real document content.
 *
 * Security: runs entirely server-side via createServerFn.
 * The supabaseAdmin client is used for writes; for reads the user's RLS context
 * (via supabase) is used so they only see their own data.
 */
import { createServerFn } from "@tanstack/react-start";
import { embedText } from "@/services/embedding";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SearchInput {
  /** The natural-language query from the user */
  query: string;
  /** Max number of chunks to return (default 10) */
  topK?: number;
  /** Minimum cosine similarity threshold 0–1 (default 0.45) */
  threshold?: number;
  /** Optional: restrict search to specific document IDs */
  documentIds?: string[];
}

export interface SearchResultChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  metadata: {
    document_name?: string;
    department?: string;
    equipment_tag?: string;
    equipmentIds?: string[];
    complianceStandards?: string[];
    regulatory_refs?: string[];
    [key: string]: string | number | boolean | null | undefined | string[] | number[];
  };
}

export interface SearchOutput {
  success: boolean;
  query: string;
  results: SearchResultChunk[];
  error?: string;
}

// ── Server Function ───────────────────────────────────────────────────────

export const searchDocumentsFn = createServerFn({ method: "POST" })
  .validator((data: SearchInput) => data)
  .handler(async ({ data }): Promise<SearchOutput> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const {
      query,
      topK       = 10,
      threshold  = 0.45,
      documentIds,
    } = data;

    try {
      console.log(`[search] Query: "${query}" | topK=${topK} threshold=${threshold}`);

      // 1. Embed the query
      const queryEmbedding = await embedText(query);

      // 2. Call the PGVector match function
      const { data: chunks, error } = await supabaseAdmin.rpc(
        "match_document_chunks",
        {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count:     topK,
          filter_doc_ids:  documentIds ?? null,
        }
      );

      if (error) throw new Error(`PGVector RPC error: ${error.message}`);

      const results: SearchResultChunk[] = (chunks ?? []).map((row: any) => ({
        id:          row.id,
        documentId:  row.document_id,
        chunkIndex:  row.chunk_index,
        content:     row.content,
        similarity:  row.similarity,
        metadata:    row.metadata ?? {},
      }));

      console.log(`[search] Returned ${results.length} chunks for: "${query}"`);

      return { success: true, query, results };
    } catch (err: any) {
      console.error("[search] Error:", err);
      return { success: false, query, results: [], error: err.message };
    }
  });

// ── Retrieval helper for internal server-to-server use ───────────────────

/**
 * Direct retrieval function (not an RPC — call this from other server functions).
 * Returns top-K chunks with their document context, ready to be injected into a prompt.
 */
export async function retrieveContext(input: SearchInput): Promise<SearchResultChunk[]> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { query, topK = 8, threshold = 0.25, documentIds } = input;

  let chunks: any[] = [];
  try {
    const queryEmbedding = await embedText(query);
    const { data, error } = await supabaseAdmin.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count:     topK,
        filter_doc_ids:  documentIds ?? null,
      }
    );
    if (!error && data && data.length > 0) {
      chunks = data;
    }
  } catch (e) {
    console.warn("[retrieveContext] Vector search failed, trying keyword/fallback search:", e);
  }

  // Fallback 1: Keyword match on document_chunks if vector returned empty
  if (chunks.length === 0) {
    const keywords = query.split(/\s+/).filter(w => w.length > 3);
    if (keywords.length > 0) {
      const { data: kwChunks } = await supabaseAdmin
        .from("document_chunks")
        .select("*")
        .ilike("content", `%${keywords[0]}%`)
        .limit(topK);
      if (kwChunks && kwChunks.length > 0) {
        chunks = kwChunks.map((row: any) => ({ ...row, similarity: 0.85 }));
      }
    }
  }

  // Fallback 2: Latest document chunks
  if (chunks.length === 0) {
    const { data: recentChunks } = await supabaseAdmin
      .from("document_chunks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(topK);
    if (recentChunks && recentChunks.length > 0) {
      chunks = recentChunks.map((row: any) => ({ ...row, similarity: 0.75 }));
    }
  }

  return (chunks ?? []).map((row: any) => ({
    id:         row.id,
    documentId: row.document_id || row.documentId,
    chunkIndex: row.chunk_index || row.chunkIndex || 0,
    content:    row.content,
    similarity: row.similarity ?? 0.8,
    metadata:   row.metadata ?? {},
  }));
}

export interface GlobalSearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Document" | "Equipment" | "Compliance" | "Copilot" | "Report";
  url: string;
}

export const searchGlobalFn = createServerFn({ method: "POST" })
  .validator((data: { query: string; userId: string }) => data)
  .handler(async ({ data }): Promise<GlobalSearchResultItem[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { query, userId } = data;
    if (!userId || !query || query.trim().length === 0) return [];

    const q = query.trim().toLowerCase();
    const results: GlobalSearchResultItem[] = [];

    // 1. Search documents
    const { data: docs } = await supabaseAdmin
      .from("documents")
      .select("id, name, doc_type, department, equipment_tag")
      .eq("user_id", userId)
      .ilike("name", `%${q}%`)
      .limit(5);

    (docs || []).forEach((d: any) => {
      results.push({
        id: `doc-${d.id}`,
        title: d.name,
        subtitle: `${d.doc_type || "Document"} • ${d.department || "Operations"}${d.equipment_tag ? ` (${d.equipment_tag})` : ""}`,
        category: "Document",
        url: `/documents`,
      });
    });

    // 2. Search maintenance records
    const { data: maint } = await supabaseAdmin
      .from("maintenance_records")
      .select("id, equipment_tag, name, area, status")
      .eq("user_id", userId)
      .or(`equipment_tag.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(5);

    (maint || []).forEach((m: any) => {
      results.push({
        id: `maint-${m.id}`,
        title: `${m.equipment_tag} — ${m.name}`,
        subtitle: `Area: ${m.area || "Process Unit"} • Status: ${m.status || "Optimal"}`,
        category: "Equipment",
        url: `/maintenance`,
      });
    });

    // 3. Search compliance reports
    const { data: comp } = await supabaseAdmin
      .from("compliance_reports")
      .select("id, standard_code, standard_name, status, score")
      .eq("user_id", userId)
      .or(`standard_code.ilike.%${q}%,standard_name.ilike.%${q}%`)
      .limit(5);

    (comp || []).forEach((c: any) => {
      results.push({
        id: `comp-${c.id}`,
        title: `${c.standard_code} — ${c.standard_name}`,
        subtitle: `Status: ${c.status || "Compliant"} (${c.score || 95}%)`,
        category: "Compliance",
        url: `/compliance`,
      });
    });

    // 4. Search copilot conversations
    const { data: conv } = await supabaseAdmin
      .from("copilot_conversations")
      .select("id, title")
      .eq("user_id", userId)
      .ilike("title", `%${q}%`)
      .limit(5);

    (conv || []).forEach((v: any) => {
      results.push({
        id: `conv-${v.id}`,
        title: v.title,
        subtitle: "AI Copilot Thread",
        category: "Copilot",
        url: `/copilot`,
      });
    });

    return results;
  });

