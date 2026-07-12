
DROP POLICY IF EXISTS "Allow public read access on extensions" ON storage.objects;
-- No SELECT policy => storage.objects listing blocked. Files are still fetchable directly because the bucket is public.
