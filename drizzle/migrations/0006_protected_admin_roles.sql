CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('admin','moderator','user')),
 UNIQUE(user_id,role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid());
INSERT INTO public.user_roles (user_id,role)
SELECT p.id,'admin' FROM public.profiles p JOIN auth.users u ON u.id=p.id
WHERE p.is_admin=true AND lower(u.email)='hafeezjamadar295@gmail.com';
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='admin'); $$;
COMMENT ON COLUMN public.profiles.is_admin IS 'DEPRECATED: compatibility display flag only; authoritative privileges are stored in public.user_roles.';