-- Fix Function Search Path Mutable warning for get_current_session_id function
CREATE OR REPLACE FUNCTION public.get_current_session_id()
RETURNS TEXT AS $$
BEGIN
  -- Get session ID from RLS context set by client
  RETURN current_setting('rls.session_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';