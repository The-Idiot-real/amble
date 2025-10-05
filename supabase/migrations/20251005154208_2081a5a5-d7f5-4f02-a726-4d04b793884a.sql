-- Fix files table RLS policies to allow everyone to upload and view
DROP POLICY IF EXISTS "Anyone can upload files" ON public.files;
DROP POLICY IF EXISTS "Files are publicly readable" ON public.files;

-- Allow anyone to insert files (no authentication required)
CREATE POLICY "Anyone can upload files publicly"
ON public.files
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view all public files
CREATE POLICY "Everyone can view all files"
ON public.files
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update files (for download counts)
CREATE POLICY "Anyone can update files"
ON public.files
FOR UPDATE
TO anon, authenticated
USING (true);

-- Fix storage bucket policies for public uploads
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

-- Allow anyone to upload to the files bucket
CREATE POLICY "Public upload to files bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'files');

-- Allow anyone to view files in the files bucket
CREATE POLICY "Public view files bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'files');

-- Allow anyone to update files in the files bucket
CREATE POLICY "Public update files bucket"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'files');