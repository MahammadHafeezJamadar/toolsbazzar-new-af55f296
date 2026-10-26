CREATE TABLE public.google_ai_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gmail text NOT NULL,
  password text NOT NULL DEFAULT '',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX google_ai_accounts_user_idx ON public.google_ai_accounts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_ai_accounts TO authenticated;
GRANT ALL ON public.google_ai_accounts TO service_role;
ALTER TABLE public.google_ai_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage google ai accounts" ON public.google_ai_accounts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER update_google_ai_accounts_updated_at BEFORE UPDATE ON public.google_ai_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();