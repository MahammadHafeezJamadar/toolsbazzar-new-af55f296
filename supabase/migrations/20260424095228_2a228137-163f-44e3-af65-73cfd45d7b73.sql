ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_start_date date,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;