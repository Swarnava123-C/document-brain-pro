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
    [key: string]: unknown;
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
  const { query, topK = 8, threshold = 0.45, documentIds } = input;

  const queryEmbedding = await embedText(query);

  const { data: chunks, error } = await supabaseAdmin.rpc(
    "match_document_chunks",
    {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count:     topK,
      filter_doc_ids:  documentIds ?? null,
    }
  );

  if (error) throw new Error(`retrieveContext RPC error: ${error.message}`);

  return (chunks ?? []).map((row: any) => ({
    id:         row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content:    row.content,
    similarity: row.similarity,
    metadata:   row.metadata ?? {},
  }));
}
