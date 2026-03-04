INSERT INTO storage.buckets (id, name, public) VALUES ('extensions', 'extensions', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on extensions" ON storage.objects FOR SELECT TO public USING (bucket_id = 'extensions');

CREATE POLICY "Allow admin upload to extensions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'extensions' AND public.is_admin(auth.uid()));