-- Phase 4: Copilot Conversations and Messages

-- 1. copilot_conversations table
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  title       text NOT NULL,
  pinned      boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. copilot_messages table
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         text NOT NULL,
  citations       jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_id ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id ON public.copilot_messages(conversation_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can only see and manage their own conversations
CREATE POLICY "Users can manage own conversations"
  ON public.copilot_conversations
  FOR ALL
  USING (user_id = auth.uid());

-- Users can only see and manage messages in their own conversations
CREATE POLICY "Users can manage own messages"
  ON public.copilot_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.copilot_conversations c
      WHERE c.id = conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on copilot_conversations when a new message is added
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
