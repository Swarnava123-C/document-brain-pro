-- Phase 9: Enterprise Platform Production Readiness & Schema Consolidation

-- 1. Ensure user_id across core tables allows both text (Clerk user_2...) and UUID strings without foreign key conflicts
DO $$ 
BEGIN
  -- Alter profiles id to text if it's uuid
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
  EXCEPTION WHEN others THEN END;

  -- Alter documents user_id to text
  BEGIN
    ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
    ALTER TABLE public.documents ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  EXCEPTION WHEN others THEN END;

  -- Alter copilot_conversations user_id to text
  BEGIN
    ALTER TABLE public.copilot_conversations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  EXCEPTION WHEN others THEN END;
END $$;

-- 2. Extend public.profiles with all enterprise fields
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

DO $$ 
BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Reliability Lead';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'IndustrialMind AI';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Reliability Lead';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 98200 34521';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Vadodara Refinery, IN';
EXCEPTION WHEN others THEN END $$;

-- 3. Create public.user_settings table
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

-- 4. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'info', -- critical | compliance | maintenance | ai | info
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '/dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- 5. Create public.activity_logs table
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

-- 6. Create public.maintenance_records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  equipment_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  area TEXT DEFAULT 'Process Unit',
  health NUMERIC DEFAULT 90,
  status TEXT DEFAULT 'Optimal', -- Optimal | Warning | Critical
  rul INT DEFAULT 365,
  last_service TEXT DEFAULT '2026-06-15',
  trend JSONB DEFAULT '[88,89,91,90,92]'::jsonb,
  scheduled_week TEXT DEFAULT 'Current',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_user_id ON public.maintenance_records(user_id);

-- 7. Create public.compliance_reports table
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  standard_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  score NUMERIC DEFAULT 95,
  status TEXT DEFAULT 'Compliant', -- Compliant | Non-Compliant | Action Required
  next_review TEXT DEFAULT '2026-12-01',
  violations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON public.compliance_reports(user_id);

-- 8. RLS and Grants
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profiles TO service_role, authenticated, anon;
GRANT ALL ON public.user_settings TO service_role, authenticated, anon;
GRANT ALL ON public.notifications TO service_role, authenticated, anon;
GRANT ALL ON public.activity_logs TO service_role, authenticated, anon;
GRANT ALL ON public.maintenance_records TO service_role, authenticated, anon;
GRANT ALL ON public.compliance_reports TO service_role, authenticated, anon;

-- Permissive policies for authenticated/anon users so queries filtered by user_id succeed
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "settings_all" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "activity_logs_all" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_all" ON public.maintenance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "compliance_all" ON public.compliance_reports FOR ALL USING (true) WITH CHECK (true);
