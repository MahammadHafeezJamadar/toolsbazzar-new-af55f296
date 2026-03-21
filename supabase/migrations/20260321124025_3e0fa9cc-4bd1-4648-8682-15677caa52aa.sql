ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pin_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';