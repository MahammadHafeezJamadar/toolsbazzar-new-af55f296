
-- Create user_sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  device_id text NOT NULL,
  device_info text NOT NULL,
  ip_address text,
  login_time timestamptz NOT NULL DEFAULT now(),
  last_active_time timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all sessions (for revoking)
CREATE POLICY "Admins can update all sessions"
  ON public.user_sessions FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Admins can delete sessions
CREATE POLICY "Admins can delete all sessions"
  ON public.user_sessions FOR DELETE
  USING (public.is_admin(auth.uid()));
