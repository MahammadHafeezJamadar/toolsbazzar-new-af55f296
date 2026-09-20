# FlowX Extension Access

## Build
- Add the uploaded Private and Shared ZIP packages as managed downloadable assets.
- Add one premium FlowX Extension section to the user dashboard.
- Select the package strictly from the stored plan value: `Private` receives Private; `Shared` receives Shared; no fallback package.
- Require an active subscription whose expiry date is still in the future (or has no expiry date). Hide the entire extension section when inactive, expired, or the plan is not Private/Shared.
- For eligible users, require the existing profile-completion fields: name, mobile number, and city.
- Show the matching card locked with “Complete your profile to unlock the extension.” until those fields are complete; link the action to the profile page.
- Once complete, show a direct download button for only the matching ZIP.
- Reuse the existing live profile updates so access disappears automatically when the plan, status, or expiry changes.

## Presentation
- Use the existing FlowX black theme with silver highlights, restrained glass, subtle glow, a premium extension icon, and a clear Private or Shared badge.
- Keep motion lightweight and respect reduced-motion preferences.
- Make the section usable from 320px mobile through desktop without changing other dashboard areas.

## Boundaries and verification
- Do not change Finance, payments, credits, authentication, permissions, pricing, or unrelated settings.
- Verify Private/Shared package isolation, locked-profile behavior, inactive/expired hiding, downloads, and responsive rendering.
