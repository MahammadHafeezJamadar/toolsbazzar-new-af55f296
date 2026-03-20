ALTER TABLE public.profiles ADD COLUMN credits_total integer NOT NULL DEFAULT 1000;
ALTER TABLE public.profiles ADD COLUMN credits_used integer NOT NULL DEFAULT 0;