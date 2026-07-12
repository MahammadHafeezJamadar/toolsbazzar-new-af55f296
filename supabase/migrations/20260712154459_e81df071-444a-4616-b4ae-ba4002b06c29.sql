
-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions that should not be directly callable
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_api_key_on_signup() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.archive_finance_period() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_referral(text, uuid) FROM anon, PUBLIC;

-- Restrict listing files in public 'extensions' bucket (direct URL access still works)
DROP POLICY IF EXISTS "Extensions bucket no listing" ON storage.objects;
DROP POLICY IF EXISTS "Public read extensions" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to extensions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read extensions" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
