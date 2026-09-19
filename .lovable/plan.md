# FlowX Admin User Management Upgrade

## Goal
Build a premium, responsive user-management experience inside the existing Admin Panel while preserving authentication, permissions, finance records, finance calculations, and unrelated features.

## User management dashboard
- Replace the current user-card grid in the Users area with a focused management workspace.
- Add live statistic cards calculated from the loaded database records:
  - Total Users
  - Active Users
  - Expired Users
  - Suspended Users
  - Private Users
  - Shared Users
  - Total Videos Remaining
- Use expiry-first status logic: an enabled account whose expiry date has passed is shown as Expired; a manually disabled account is Suspended; otherwise it is Active.
- Count Private and Shared only when the stored plan is explicitly set to those values. Existing Starter, Basic, Pro, and Ultra users remain unchanged and unclassified until the admin edits them, as requested.

## Add user
- Add a prominent **+ Add User** action opening a polished form for name, email, password, Private/Shared plan, Active/Suspended status, videos remaining, start date, and expiry date.
- Validate email, secure password length, non-negative whole-number videos, and sensible dates.
- Create the login account through a protected backend function, then persist the profile fields through the existing signup/profile flow.
- Restrict the backend function to the authorized admin account and never expose privileged credentials to the browser.

## User table and actions
- Add search plus Plan and Status filters.
- Show Name, Email, Plan Type, Status, Videos Remaining, Expiry Date, automatically calculated Remaining Days, and Actions.
- Provide View, Edit, and Suspend/Activate controls; editing supports the requested user fields without any Credits or Private Plan toggle.
- Use a desktop table and a compact stacked mobile presentation so all actions remain usable from 320px upward.
- Refresh the list and statistics after every successful create or edit, and subscribe to profile changes so database updates appear automatically.

## Security
- Keep the existing sign-in flow intact.
- Tighten the shared database admin check so administrative database policies recognize only `hafeezjamadar295@gmail.com` with the existing admin flag.
- Apply the same email-and-admin verification inside the user-creation backend function, protecting direct requests as well as the UI.
- Keep direct `/admin` access denied for every other account.

## Visual direction
- Preserve the FlowX pure-black theme and existing Syne/DM Sans typography.
- Use restrained glass surfaces, teal/silver highlights, crisp status badges, clean spacing, subtle hover lift, and short lightweight transitions.
- Reuse existing design-system controls and semantic theme tokens; no heavy animation.

## Data boundaries
- Reuse existing profile fields: `name`, `email`, `plan`, `subscription_active`, `video_remaining`, `plan_start_date`, and `expiry_date`.
- Do not add Credits or a Private Plan ON/OFF control.
- Do not read, write, migrate, rename, recalculate, or delete transactions, finance periods, archived finance transactions, sales, stock, investment, profit, or any finance field/formula.
- Do not rewrite existing users' plans or other stored data.

## Verification
- Confirm only the authorized admin can open the Admin Panel and invoke user creation.
- Create a test account through the admin form, verify its profile values, then remove only that test account.
- Verify statistics, filters, remaining-days calculation, edit, and suspend behavior.
- Check desktop and 320px mobile layouts, then run the project checks.
- Compare finance table row counts and aggregate totals before and after implementation to confirm they are unchanged.
