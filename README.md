# Dinning Zone – Delivery Web App (PWA)

Mobile-first food delivery web-app for the restaurant **Dinning Zone** (brand name is kept in one config constant: `src/config/brand.ts` – confirm spelling with the client).

Three role-based areas in ONE codebase / ONE deployment:

| Area | Route | Who | Purpose |
|---|---|---|---|
| Customer app | `/` | Customers | Browse menu, cart, coupons, pay (COD / Razorpay), track order, delivery OTP, rate |
| Admin panel | `/admin` | Restaurant owner/staff | Live orders, menu, categories, coupons, riders, reviews, settings, reports |
| Rider app | `/rider` | Own delivery staff | Assigned orders, status updates, delivery-OTP verification, COD cash confirmation |

## Decisions already taken (from our Q&A)
- Payments: **COD + Razorpay online (UPI/cards)**
- Login: **Email+password AND Google**
- Extras in v1: **Coupons, Order status notifications (push), Ratings & reviews**
- Delivery: **own riders**, **max 5 km radius** from the restaurant, delivery fee by distance tier
- Rider uses a simple rider screen (same PWA) to update status and **verify delivery with customer OTP**
- Traffic: ~500–1000 requests/day → whole stack on **free tiers (₹0/month fixed cost)**

## Files in this package
```
README.md                         ← you are here
AGENTS.md                         ← rules for Antigravity agent (keep in repo root)
docs/01-PRD.md                    ← requirements, flows, business rules
docs/02-TECH-STACK-AND-COSTS.md   ← stack, free-tier limits, cost table, gotchas
docs/03-ARCHITECTURE.md           ← folders, routes, realtime, payment/OTP/push flows
docs/04-DATABASE.md               ← schema overview + RLS notes
docs/05-EDGE-FUNCTIONS.md         ← server functions spec (Razorpay, push, rider creation)
docs/06-DEVELOPMENT-PLAN.md       ← phase-by-phase build plan with copy-paste Antigravity prompts
docs/07-SETUP-AND-DEPLOYMENT.md   ← accounts, keys, env vars, deploy, backups
supabase/migrations/001_schema.sql← full runnable SQL (tables, RLS, functions, storage, realtime)
design/STITCH-PROMPTS.md          ← design system + one prompt per screen (customer, admin, rider, brand)
design/IMAGE-PROMPTS.md           ← ChatGPT prompts: logo, icon, watermark, banners, illustrations + file checklist
```

## How to use with Antigravity
1. Create a new empty folder `dining-zone`, copy this whole package into it, open it as the workspace.
2. Keep `AGENTS.md` in the repo root (if your Antigravity version uses `.agent/rules/`, copy the same content there too).
3. Open `docs/06-DEVELOPMENT-PLAN.md` and paste **one phase prompt at a time**. Review the result, run it, then move on. Don't paste everything at once.
4. Always tell the agent: "Read AGENTS.md and the docs/ folder first."

## How to use with Stitch
0. Generate logo/banners first with `design/IMAGE-PROMPTS.md` (ChatGPT) and keep the files for Stitch + the app.
1. Open `design/STITCH-PROMPTS.md`.
2. Paste the **Global Design Brief** first (or prefix it to every prompt).
3. Then paste screen prompts one by one. Export to Figma/code or use screenshots as reference for Antigravity ("match this design").

## Things to collect from the client before launch
- Exact restaurant name spelling, logo, brand colours (design brief has defaults)
- Restaurant **latitude/longitude** (exact pin) – needed for the 5 km radius
- Opening hours, min order amount, packaging fee, GST % (if applicable), delivery fee tiers
- Menu with photos, categories, veg/non-veg, add-ons/variants
- Razorpay account (KYC done) – test keys first, live keys later
- Phone numbers of riders, restaurant support number
- Domain name (optional, ~₹700–1000/year) – free `*.pages.dev` works to start
