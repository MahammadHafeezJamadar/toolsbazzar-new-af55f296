ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS private_plan_enabled BOOLEAN NOT NULL DEFAULT false;
INSERT INTO public.global_settings (key, value) VALUES
  ('flowx_private_apk_url', '""'::jsonb),
  ('flowx_private_windows_url', '""'::jsonb),
  ('flowx_private_version', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;