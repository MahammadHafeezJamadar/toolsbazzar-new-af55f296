
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = UPPER(SUBSTR(MD5(id::text || created_at::text), 1, 8)) WHERE referral_code IS NULL;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid());
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(referral_code_input TEXT, new_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  -- Find the referrer
  SELECT id INTO referrer_uuid FROM public.profiles WHERE referral_code = referral_code_input;
  
  IF referrer_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;
  
  IF referrer_uuid = new_user_id THEN
    RETURN;
  END IF;

  -- Update referred_by on new user
  UPDATE public.profiles SET referred_by = referrer_uuid WHERE id = new_user_id;
  
  -- Give referrer 200 bonus credits
  UPDATE public.profiles SET credits_total = credits_total + 200 WHERE id = referrer_uuid;
  
  -- Give new user 100 bonus credits
  UPDATE public.profiles SET credits_total = credits_total + 100 WHERE id = new_user_id;
  
  -- Record the referral
  INSERT INTO public.referrals (referrer_id, referred_id, credits_awarded) VALUES (referrer_uuid, new_user_id, 200);
END;
$$;

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();
