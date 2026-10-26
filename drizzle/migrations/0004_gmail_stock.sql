ALTER TABLE public.google_ai_accounts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.google_ai_accounts ADD COLUMN assigned_at timestamptz;
UPDATE public.google_ai_accounts SET assigned_at = created_at WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX google_ai_accounts_gmail_unique ON public.google_ai_accounts (lower(gmail));
CREATE OR REPLACE FUNCTION public.return_gmails_to_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.google_ai_accounts SET user_id = NULL, assigned_at = NULL WHERE user_id = OLD.id;
  RETURN OLD;
END; $$;
REVOKE EXECUTE ON FUNCTION public.return_gmails_to_stock() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER return_gmails_on_profile_delete AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.return_gmails_to_stock();