ALTER TABLE public.profiles ADD COLUMN daily_credits_limit integer NOT NULL DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN credits_used_today integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_reset_date date NOT NULL DEFAULT CURRENT_DATE;