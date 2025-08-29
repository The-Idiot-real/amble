-- Fix security vulnerability: Private Chat Conversations Exposed to Public
-- Replace public read policies with session-based access control

-- Drop existing public read policies
DROP POLICY IF EXISTS "Chat conversations are publicly readable" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat messages are publicly readable" ON public.chat_messages;

-- Create function to get current session ID from RLS context
-- This will be set by the client when making requests
CREATE OR REPLACE FUNCTION public.get_current_session_id()
RETURNS TEXT AS $$
BEGIN
  -- Get session ID from RLS context set by client
  RETURN current_setting('rls.session_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies that restrict access based on session ownership
CREATE POLICY "Users can only view their own conversations"
ON public.chat_conversations
FOR SELECT
USING (
  session_id = public.get_current_session_id()
);

CREATE POLICY "Users can only view messages from their conversations"
ON public.chat_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE session_id = public.get_current_session_id()
  )
);

-- Keep existing insert/update policies as they are appropriately restricted