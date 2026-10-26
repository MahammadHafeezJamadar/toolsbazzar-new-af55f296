ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.guard_video_remaining()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.video_remaining IS DISTINCT FROM OLD.video_remaining THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can change video counts';
    END IF;
    NEW.video_updated_at := now();
  ELSIF NEW.video_updated_at IS DISTINCT FROM OLD.video_updated_at THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      NEW.video_updated_at := OLD.video_updated_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_video_remaining() FROM anon, authenticated;

CREATE TRIGGER guard_video_remaining_trg BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_video_remaining();