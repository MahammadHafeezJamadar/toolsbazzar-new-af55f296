
-- Archive table for finance periods
CREATE TABLE public.finance_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE,
  end_date DATE,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  final_balance NUMERIC NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_periods TO authenticated;
GRANT ALL ON public.finance_periods TO service_role;

ALTER TABLE public.finance_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage finance periods"
ON public.finance_periods FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Archived transactions linked to a period
CREATE TABLE public.finance_period_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES public.finance_periods(id) ON DELETE CASCADE,
  original_id UUID,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  amount NUMERIC NOT NULL,
  original_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_fpt_period_id ON public.finance_period_transactions(period_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_period_transactions TO authenticated;
GRANT ALL ON public.finance_period_transactions TO service_role;

ALTER TABLE public.finance_period_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage archived transactions"
ON public.finance_period_transactions FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Atomic archive + reset function
CREATE OR REPLACE FUNCTION public.archive_finance_period()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_period_id UUID;
  v_start DATE;
  v_end DATE;
  v_income NUMERIC;
  v_expenses NUMERIC;
  v_count INTEGER;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT MIN(date), MAX(date),
    COALESCE(SUM(CASE WHEN type IN ('BASIC','PRO','ULTRA','BASEIC') THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type IN ('EXPENSE','EXPense') THEN amount ELSE 0 END), 0),
    COUNT(*)
  INTO v_start, v_end, v_income, v_expenses, v_count
  FROM public.transactions;

  INSERT INTO public.finance_periods (start_date, end_date, total_income, total_expenses, final_balance, total_transactions)
  VALUES (v_start, v_end, v_income, v_expenses, v_income - v_expenses, v_count)
  RETURNING id INTO new_period_id;

  INSERT INTO public.finance_period_transactions (period_id, original_id, date, type, label, amount, original_created_at)
  SELECT new_period_id, id, date, type, label, amount, created_at FROM public.transactions;

  DELETE FROM public.transactions;

  RETURN new_period_id;
END;
$$;
