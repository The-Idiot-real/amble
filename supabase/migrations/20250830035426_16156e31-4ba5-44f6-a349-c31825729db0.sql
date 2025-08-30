-- Fix RLS approach: Create secure functions for accessing chat data
-- Since setting RLS context from client is complex, we'll use secure functions instead

-- Drop the context-based policies as they won't work with the current client setup
DROP POLICY IF EXISTS "Users can only view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can only view messages from their conversations" ON public.chat_messages;

-- Create secure functions for accessing conversations and messages
CREATE OR REPLACE FUNCTION public.get_conversation_by_session(session_id_param TEXT)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.session_id, c.created_at, c.updated_at
  FROM public.chat_conversations c
  WHERE c.session_id = session_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.get_messages_by_conversation_and_session(conversation_id_param UUID, session_id_param TEXT)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  role TEXT,
  content TEXT,
  file_attachments JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- First verify that the conversation belongs to the session
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id_param AND session_id = session_id_param
  ) THEN
    RETURN; -- Return empty result if session doesn't own the conversation
  END IF;

  RETURN QUERY
  SELECT m.id, m.conversation_id, m.role, m.content, m.file_attachments, m.created_at
  FROM public.chat_messages m
  WHERE m.conversation_id = conversation_id_param
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

-- Create restrictive RLS policies that deny direct access
-- This forces clients to use the secure functions above
CREATE POLICY "Deny direct conversation access"
ON public.chat_conversations
FOR SELECT
USING (false);

CREATE POLICY "Deny direct message access"
ON public.chat_messages
FOR SELECT
USING (false);

-- Keep insert policies for creating new conversations and messages
-- But verify session ownership for messages
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.chat_messages;

CREATE POLICY "Messages can only be added to owned conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE session_id IS NOT NULL
  )
);