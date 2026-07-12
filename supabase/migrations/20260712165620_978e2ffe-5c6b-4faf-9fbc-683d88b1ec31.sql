
INSERT INTO public.global_settings (key, value) VALUES
  ('flowx_apk_url', to_jsonb('https://github.com/MahammadHafeezJamadar/FlowX_/releases/download/v1.0.2/flowx.apk'::text)),
  ('flowx_windows_url', to_jsonb('https://github.com/MahammadHafeezJamadar/FlowX_/releases/download/v1.0.2/FlowX_Windows_Updated.zip'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
