# Architecture rules
- Gmail stock views share one React Query cache and pure date/filter helpers so mutations refresh all user counts and alerts consistently.
- Gmail replacement uses an atomic, admin-checked database function so failure cannot detach the existing Gmail or allow double assignment.
- Admin screens share AdminNavigation; user view/filter state is URL-based to preserve navigation after refresh while financial screens retain their existing routes.
- Store authoritative admin roles in protected public.user_roles and use the is_admin RPC for UI and function authorization; profile flags are legacy compatibility only, preventing self-service privilege escalation.