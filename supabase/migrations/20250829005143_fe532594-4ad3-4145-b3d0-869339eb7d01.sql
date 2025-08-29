-- Fix security vulnerability: Remove unrestricted update access to files table
-- This prevents anyone from modifying file metadata, changing privacy settings, or corrupting file information

-- Drop the existing overly permissive update policy
DROP POLICY IF EXISTS "Files can be updated by anyone" ON public.files;

-- For now, we'll completely restrict updates since there's no ownership system
-- This is the most secure approach until proper user authentication and ownership is implemented

-- If file updates are needed in the future, they should be implemented with:
-- 1. User authentication system
-- 2. Ownership tracking (user_id column)  
-- 3. Proper RLS policies that only allow owners to update their files

-- The files table will remain fully functional for:
-- - File uploads (INSERT policy exists)
-- - File downloads and viewing (SELECT policy exists for public files)
-- - File metadata is protected from unauthorized modifications