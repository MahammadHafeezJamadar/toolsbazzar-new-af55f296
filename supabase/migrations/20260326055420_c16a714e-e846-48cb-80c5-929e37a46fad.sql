
-- Add new columns to user_sessions (only ones that don't already exist)
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_brand TEXT DEFAULT 'Unknown';
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS stable_fingerprint TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_number INTEGER DEFAULT 1;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS triggered_lockout BOOLEAN DEFAULT false;

-- Create security_events table
CREATE TABLE public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event TEXT,
  old_uuid TEXT,
  new_uuid TEXT,
  device_info TEXT,
  device_brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security_events" ON public.security_events
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can insert own security_events" ON public.security_events
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own security_events" ON public.security_events
  FOR SELECT TO public
  USING (auth.uid() = user_id);
