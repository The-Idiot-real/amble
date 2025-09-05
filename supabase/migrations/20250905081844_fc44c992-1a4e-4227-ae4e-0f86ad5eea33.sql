-- Create ai_chat_sessions table to store chat history (optional)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.ai_chat_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own chat sessions" 
ON public.ai_chat_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own chat sessions" 
ON public.ai_chat_sessions 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);