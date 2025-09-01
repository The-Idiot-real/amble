-- Fix RLS policies for chat tables to work without authentication

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;

-- Create new policies that work with session-based access
CREATE POLICY "Allow access based on session_id" 
ON public.chat_conversations 
FOR ALL 
USING (session_id = get_current_session_id());

CREATE POLICY "Allow message access based on conversation session" 
ON public.chat_messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = chat_messages.conversation_id 
    AND session_id = get_current_session_id()
  )
);