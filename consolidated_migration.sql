-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMPLETE & IDEMPOTENT DATABASE MIGRATION FOR INDUSTRIALMIND AI
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Run this script in your Supabase Dashboard SQL Editor:
-- Go to https://supabase.com/dashboard/project/esznmczceqrtnvzjhnxy/sql/new
-- Paste the entire contents of this file and click "Run".
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Profiles table (compatible with Clerk text ID and Supabase auth UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT DEFAULT 'Operations',
  role TEXT DEFAULT 'Reliability Lead',
  company TEXT DEFAULT 'IndustrialMind AI',
  designation TEXT DEFAULT 'Reliability Lead',
  phone TEXT DEFAULT '+91 98200 34521',
  location TEXT DEFAULT 'Vadodara Refinery, IN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure profiles id column allows text
DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
EXCEPTION WHEN others THEN END $$;

-- 3. Create Documents Pipeline table (compatible with Clerk text user_id)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'PDF',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  department TEXT,
  equipment_tag TEXT,
  engineer_name TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  current_stage INT NOT NULL DEFAULT 0,
  confidence NUMERIC(4,3),
  ai_summary TEXT,
  full_text TEXT,
  keywords TEXT[] DEFAULT '{}',
  detected_equipment TEXT[] DEFAULT '{}',
  related_assets TEXT[] DEFAULT '{}',
  regulatory_refs TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure documents user_id column allows text & full_text exists
DO $$ BEGIN
  ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
  ALTER TABLE public.documents ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS full_text TEXT;
EXCEPTION WHEN others THEN END $$;

CREATE INDEX IF NOT EXISTS documents_user_status_idx ON public.documents (user_id, status);

-- 4. Create Document Chunks table for PGVector Semantic Search
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index   integer NOT NULL,
  content       text NOT NULL,
  metadata      jsonb DEFAULT '{}'::jsonb,
  embedding     vector(768), -- Gemini text-embedding-004
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5. Create Copilot Conversations and Messages tables
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  title       text NOT NULL,
  pinned      boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         text NOT NULL,
  citations       jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_id ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id ON public.copilot_messages(conversation_id);

-- 6. Create Enterprise Platform tables
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'English (US)',
  timezone TEXT DEFAULT 'Asia/Kolkata (GMT +5:30)',
  notifications_email BOOLEAN DEFAULT true,
  notifications_push BOOLEAN DEFAULT true,
  dashboard_layout JSONB DEFAULT '{}'::jsonb,
  security_2fa BOOLEAN DEFAULT true,
  api_keys JSONB DEFAULT '[{"id":"ind_ai_prod_1","name":"Production API Key","prefix":"ind_ai_prod_a...f9","created":"2026-07-01"}]'::jsonb,
  integrations JSONB DEFAULT '{"sap":true,"maximo":true,"sharepoint":false,"slack":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '/dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  equipment_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  area TEXT DEFAULT 'Process Unit',
  health NUMERIC DEFAULT 90,
  status TEXT DEFAULT 'Optimal',
  rul INT DEFAULT 365,
  last_service TEXT DEFAULT '2026-06-15',
  trend JSONB DEFAULT '[88,89,91,90,92]'::jsonb,
  scheduled_week TEXT DEFAULT 'Current',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_user_id ON public.maintenance_records(user_id);

CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  standard_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  score NUMERIC DEFAULT 95,
  status TEXT DEFAULT 'Compliant',
  next_review TEXT DEFAULT '2026-12-01',
  violations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON public.compliance_reports(user_id);

-- 7. Storage Bucket configuration for Upload Center
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN others THEN END $$;

-- 8. Enable Row Level Security (RLS) & Grant Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profiles TO service_role, authenticated, anon;
GRANT ALL ON public.documents TO service_role, authenticated, anon;
GRANT ALL ON public.document_chunks TO service_role, authenticated, anon;
GRANT ALL ON public.copilot_conversations TO service_role, authenticated, anon;
GRANT ALL ON public.copilot_messages TO service_role, authenticated, anon;
GRANT ALL ON public.user_settings TO service_role, authenticated, anon;
GRANT ALL ON public.notifications TO service_role, authenticated, anon;
GRANT ALL ON public.activity_logs TO service_role, authenticated, anon;
GRANT ALL ON public.maintenance_records TO service_role, authenticated, anon;
GRANT ALL ON public.compliance_reports TO service_role, authenticated, anon;

-- Permissive public policies for Clerk text ID authorization compatibility
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documents_all" ON public.documents;
CREATE POLICY "documents_all" ON public.documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "document_chunks_all" ON public.document_chunks;
CREATE POLICY "document_chunks_all" ON public.document_chunks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "copilot_conversations_all" ON public.copilot_conversations;
CREATE POLICY "copilot_conversations_all" ON public.copilot_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "copilot_messages_all" ON public.copilot_messages;
CREATE POLICY "copilot_messages_all" ON public.copilot_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settings_all" ON public.user_settings;
CREATE POLICY "settings_all" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "activity_logs_all" ON public.activity_logs;
CREATE POLICY "activity_logs_all" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "maintenance_all" ON public.maintenance_records;
CREATE POLICY "maintenance_all" ON public.maintenance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "compliance_all" ON public.compliance_reports;
CREATE POLICY "compliance_all" ON public.compliance_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "storage_documents_all" ON storage.objects;
CREATE POLICY "storage_documents_all" ON storage.objects FOR ALL USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');

-- 9. Functions and Triggers
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding   vector(768),
  match_threshold   float     DEFAULT 0.5,
  match_count       int       DEFAULT 10,
  filter_doc_ids    uuid[]    DEFAULT NULL
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
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.copilot_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.copilot_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON public.copilot_messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();
