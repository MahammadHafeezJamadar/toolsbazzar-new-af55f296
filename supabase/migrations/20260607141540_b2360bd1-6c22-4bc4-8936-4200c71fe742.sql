ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

UPDATE public.profiles
SET api_key = replace(gen_random_uuid()::text, '-', '')
WHERE api_key IS NULL;

CREATE OR REPLACE FUNCTION public.generate_api_key_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_api_key ON public.profiles;
CREATE TRIGGER set_api_key
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_api_key_on_signup();