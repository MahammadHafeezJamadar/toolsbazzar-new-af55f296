ALTER TABLE public.google_ai_accounts ADD COLUMN subscription_start_date date;
UPDATE public.google_ai_accounts SET subscription_start_date = start_date;
COMMENT ON COLUMN public.google_ai_accounts.start_date IS 'DEPRECATED: replaced by nullable subscription_start_date for missing-date tracking';
CREATE OR REPLACE FUNCTION public.replace_user_gmail(p_user_id uuid, p_old_id uuid, p_new_id uuid) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF p_old_id = p_new_id THEN RAISE EXCEPTION 'Choose a different Gmail'; END IF;
 PERFORM id FROM public.google_ai_accounts WHERE id IN (p_old_id,p_new_id) ORDER BY id FOR UPDATE;
 IF NOT EXISTS (SELECT 1 FROM public.google_ai_accounts WHERE id=p_old_id AND user_id=p_user_id) THEN RAISE EXCEPTION 'Original Gmail is no longer assigned to this user'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.google_ai_accounts WHERE id=p_new_id AND user_id IS NULL AND enabled=true AND credits_exhausted=false) THEN RAISE EXCEPTION 'Replacement Gmail is no longer available'; END IF;
 UPDATE public.google_ai_accounts SET user_id=p_user_id, assigned_at=now() WHERE id=p_new_id;
 UPDATE public.google_ai_accounts SET user_id=NULL, assigned_at=NULL WHERE id=p_old_id;
END; $$;
REVOKE ALL ON FUNCTION public.replace_user_gmail(uuid,uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_user_gmail(uuid,uuid,uuid) TO authenticated;