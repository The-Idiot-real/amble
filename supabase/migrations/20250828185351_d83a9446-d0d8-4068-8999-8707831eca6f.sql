-- Create files table for storing file metadata
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  topic TEXT,
  description TEXT,
  tags TEXT[],
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  download_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversions table for tracking file conversions
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  original_format TEXT NOT NULL,
  target_format TEXT NOT NULL,
  converted_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create chat_conversations table for AI chat
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for storing chat history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  file_attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public file access (since general people need to upload and view)
CREATE POLICY "Files are publicly readable" ON public.files FOR SELECT USING (is_public = true);
CREATE POLICY "Anyone can upload files" ON public.files FOR INSERT WITH CHECK (true);
CREATE POLICY "Files can be updated by anyone" ON public.files FOR UPDATE USING (true);

-- Create policies for conversions
CREATE POLICY "Conversions are publicly readable" ON public.conversions FOR SELECT USING (true);
CREATE POLICY "Anyone can create conversions" ON public.conversions FOR INSERT WITH CHECK (true);
CREATE POLICY "Conversions can be updated" ON public.conversions FOR UPDATE USING (true);

-- Create policies for chat (public access for AI chat)
CREATE POLICY "Chat conversations are publicly readable" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat conversations" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Chat conversations can be updated" ON public.chat_conversations FOR UPDATE USING (true);

CREATE POLICY "Chat messages are publicly readable" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_files_upload_date ON public.files(upload_date DESC);
CREATE INDEX idx_files_file_type ON public.files(file_type);
CREATE INDEX idx_files_is_public ON public.files(is_public);
CREATE INDEX idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX idx_conversions_status ON public.conversions(status);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

-- Create storage policies
CREATE POLICY "Files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'files');
CREATE POLICY "Anyone can upload files to files bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files');
CREATE POLICY "Anyone can update files in files bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'files');
CREATE POLICY "Anyone can delete files in files bucket" ON storage.objects FOR DELETE USING (bucket_id = 'files');