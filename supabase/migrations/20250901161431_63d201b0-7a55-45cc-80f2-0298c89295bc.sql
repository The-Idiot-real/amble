-- Create a helper function to set RLS context for session-based access
CREATE OR REPLACE FUNCTION public.set_session_context(session_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Store session ID in a way that can be accessed by RLS policies
  PERFORM set_config('rls.session_id', session_id_param, true);
END;
$$;