# AI Video Flow

Build a full-stack web app called "MyFlow" — an AI Video Generation platform. Use React + Tailwind + Supabase.

Pages & Structure:

1. Landing Page (/) with these sections:

Navbar: Logo, links (Features, Pricing, Testimonials, About), Login + Get Started buttons

Hero: Bold headline like "Where AI Creativity Begins", subtext, two CTA buttons (Create with Flow, Learn More), stats (10K+ Users, 99.9% Uptime, 24/7 Support)

Features section: 6 feature cards (v3.1 Access, AI Video Generation, Best Price Guarantee, Lightning Fast, Secure & Private, 24/7 Support)

Pricing section: 3 plans — Basic (₹299/mo), Pro (₹599/mo), Enterprise (₹999/mo) — each with feature list and Get Started button

Testimonials: 3 user reviews

CTA banner: "Ready to Get Started?" with button

Footer: Links (Product, Company, Legal, Support)

Floating WhatsApp button (bottom-right corner, green, opens https://wa.me/91XXXXXXXXXX — replace with real number)

2. Auth Pages:

/login — email + password login

/register — name, email, password signup

3. User Dashboard (/dashboard):

Show: subscription status (Active/Inactive badge), plan name, expiry date

Button: "Open Google Flow" (just UI for now)

Button: "Download Extension" (download link placeholder)

Profile section: user email display

4. Admin Panel (/admin):

Protected route (only admin email can access)

Table of all users: name, email, plan, subscription status, expiry date

Actions per user: Toggle subscription Active/Inactive, Set expiry date, Edit plan name

Add new user button

5. API Endpoint:

GET /api/google-token — checks logged-in user's session via Supabase, returns JSON: { status, google_email, google_password, subscription: { status, expiry_date }, cookies }

Supabase Tables:

profiles: id, email, name, plan, subscription_active (bool), expiry_date, google_email, google_password, cookies_json, is_admin (bool)

Design:

Dark theme (deep navy/black background)

NOT purple gradient — use deep teal + electric blue accent colors

Font: modern, clean (NOT Inter — use Plus Jakarta Sans or Outfit)

Glassmorphism cards

Smooth hover animations

Mobile responsive

NO payment gateway — remove all payment buttons/links

WhatsApp floating button bottom-right: green circle with WhatsApp icon, opens wa.me link on click

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://toolsbazzar-new.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae2a1c6a-b1fc-42ae-b7f5-3fa3842aaf0a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
