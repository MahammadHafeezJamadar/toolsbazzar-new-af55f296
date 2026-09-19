ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS video_remaining integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_video_remaining_non_negative CHECK (video_remaining >= 0);

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = _user_id
      AND p.is_admin = true
      AND lower(u.email) = 'hafeezjamadar295@gmail.com'
  );
$function$;