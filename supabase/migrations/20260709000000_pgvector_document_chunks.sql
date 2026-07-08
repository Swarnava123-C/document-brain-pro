-- Phase 3: PGVector - Document Chunks for Semantic Search
-- Run this in your Supabase SQL editor or via `npx supabase db push`

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index   integer NOT NULL,
  content       text NOT NULL,
  metadata      jsonb DEFAULT '{}'::jsonb,
  -- Gemini text-embedding-004 produces 768-dimensional vectors
  embedding     vector(768),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Index for fast document lookups
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
  ON public.document_chunks(document_id);

-- 4. IVFFlat index for approximate nearest-neighbor search
--    lists=100 is suitable for up to ~1M rows; increase for larger datasets
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5. Enable Row Level Security
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 6. RLS policy: users can only read chunks for their own documents
CREATE POLICY "Users can read own document chunks"
  ON public.document_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
        AND d.user_id = auth.uid()
    )
  );

-- 7. Service-role bypass (for server-side writes, no auth.uid() context)
-- The supabaseAdmin client bypasses RLS so we do not need an insert policy.

-- 8. Semantic similarity search function
-- Returns chunks ranked by cosine similarity to the query embedding.
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding   vector(768),
  match_threshold   float     DEFAULT 0.5,
  match_count       int       DEFAULT 10,
  filter_doc_ids    uuid[]    DEFAULT NULL  -- optional: restrict to specific docs
)
RETURNS TABLE (
  id            uuid,
  document_id   uuid,
  chunk_index   integer,
  content       text,
  metadata      jsonb,
  similarity    float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE
    dc.embedding IS NOT NULL
    AND (filter_doc_ids IS NULL OR dc.document_id = ANY(filter_doc_ids))
    AND 1 - (dc.embedding <=> query_embedding) >= match_threshold
  ORDER BY dc.embedding <=> query_embedding  -- ascending distance = descending similarity
  LIMIT match_count;
END;
$$;

-- 9. Also add full_text column to documents for storing raw extracted text
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS full_text text;
