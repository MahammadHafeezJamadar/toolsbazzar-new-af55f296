
CREATE TABLE public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global_settings"
ON public.global_settings
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read global_settings"
ON public.global_settings
FOR SELECT
TO authenticated
USING (true);
