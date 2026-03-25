
ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_name text NOT NULL DEFAULT 'Unknown Device',
  ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 1;
