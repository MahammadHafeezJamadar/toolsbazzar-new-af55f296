# Architecture rules
- Gmail stock views share one React Query cache and pure date/filter helpers so mutations refresh all user counts and alerts consistently.
- Gmail replacement uses an atomic, admin-checked database function so failure cannot detach the existing Gmail or allow double assignment.