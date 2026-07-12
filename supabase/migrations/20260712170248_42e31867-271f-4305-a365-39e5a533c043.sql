
ALTER FUNCTION public.archive_finance_period() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.archive_finance_period() FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_finance_period() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_referral(text, uuid) FROM authenticated, anon, PUBLIC;
