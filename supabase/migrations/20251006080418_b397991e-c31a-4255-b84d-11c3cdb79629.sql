-- Drop all existing restrictive policies on files table
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can view own files" ON public.files;
DROP POLICY IF EXISTS "Everyone can view public files" ON public.files;
DROP POLICY IF EXISTS "Anyone can update files" ON public.files;
DROP POLICY IF EXISTS "Anyone can upload files publicly" ON public.files;
DROP POLICY IF EXISTS "Everyone can view all files" ON public.files;

-- Create universal access policies for files table
CREATE POLICY "Anyone can view all files"
  ON public.files
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert files"
  ON public.files
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update files"
  ON public.files
  FOR UPDATE
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete files"
  ON public.files
  FOR DELETE
  TO public, anon, authenticated
  USING (true);

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public access to files bucket" ON storage.objects;

-- Create universal storage policies for files bucket
CREATE POLICY "Anyone can upload to files bucket"
  ON storage.objects
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can view files bucket"
  ON storage.objects
  FOR SELECT
  TO public, anon, authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Anyone can update files bucket"
  ON storage.objects
  FOR UPDATE
  TO public, anon, authenticated
  USING (bucket_id = 'files')
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can delete from files bucket"
  ON storage.objects
  FOR DELETE
  TO public, anon, authenticated
  USING (bucket_id = 'files');

-- Ensure the files bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO UPDATE SET public = true;