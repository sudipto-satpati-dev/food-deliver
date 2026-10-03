# AGENTS.md – Rules for the coding agent (Dinning Zone)

Read this file and everything in `/docs` before writing code. Source of truth: `docs/01-PRD.md`, `docs/03-ARCHITECTURE.md`, `supabase/migrations/001_schema.sql`.

## Project
Mobile-first PWA food-delivery app for ONE restaurant. Roles: `customer`, `admin`, `rider`. Single codebase, single deploy. Must run on **free tiers** (≈500–1000 requests/day).

## Stack (do not swap without asking)
- React 18 + TypeScript + Vite, React Router v6
- Tailwind CSS + shadcn/ui + lucide-react
- TanStack Query (server state), Zustand (cart only, persisted)
- react-hook-form + zod (all forms)
- Supabase: Postgres, Auth (email+password, Google), Realtime, Storage, Edge Functions (Deno)
- Razorpay Checkout (online payments), Web Push (VAPID) for notifications
- Leaflet + OpenStreetMap (maps; NO Google Maps paid APIs)
- vite-plugin-pwa (installable PWA)
- Hosting: Cloudflare Pages (free, commercial use allowed). Do NOT use Vercel Hobby (non-commercial).

## Non-negotiable rules
1. **Never trust the client for money.** Totals, delivery fee, coupon discount, distance and OTP are computed/validated in Postgres functions (`place_order`, `calc_coupon`, `verify_delivery_otp`) – never in React.
2. **Orders are created only through `rpc('place_order')`.** No direct inserts into `orders`/`order_items`.
3. **RLS is ON for every table.** Never use the service-role key in the browser. Service role only inside Edge Functions.
4. Delivery OTP is only readable by the order owner while status = `out_for_delivery`. Riders verify through `rpc('verify_delivery_otp')`, they never read the code.
5. Razorpay: verify signature server-side (Edge Function) before marking paid. Webhook must be idempotent.
6. Don't poll. Use Supabase Realtime for orders (admin: all orders channel; customer/rider: only their active order(s)).
7. Compress images client-side (WebP, max ~1000px, <150 KB) before upload to Storage.
8. Money: `numeric(10,2)` in DB, display with `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})`. Timezone `Asia/Kolkata`.
9. Mobile-first: design for 360–430px width first. Touch targets ≥ 44px. Admin is also used on tablet/desktop (sidebar layout ≥1024px).
10. Accessibility: labels on inputs, visible focus, contrast AA, no colour-only status.

## Brand assets
Logos, icons, watermark in `public/brand/`; banners/hero/OG image in `public/banners/` (spec in `design/IMAGE-PROMPTS.md`). Use WebP, lazy-load, fixed aspect-ratio boxes, always provide `alt` text. Banners come with empty space for text – overlay text in HTML/CSS (don't bake text into images). Offer banner text must come from coupons data where possible.

## Code conventions
- Feature-folder structure (see docs/03-ARCHITECTURE.md). One component per file, named exports.
- Types for DB generated with `supabase gen types typescript` → `src/types/database.ts`. No `any`.
- All data access in `features/*/api.ts` + hooks in `features/*/hooks.ts`. Components don't call supabase directly.
- Every list/query screen needs: loading skeleton, empty state, error state with retry.
- Env vars only via `import.meta.env.VITE_*` (public) – secrets live in Supabase Edge Function secrets.
- Commit small, meaningful commits per feature. Run `npm run lint && npm run typecheck && npm run build` before saying a task is done.

## Definition of done (per task)
Works on a 390×844 viewport, handles loading/empty/error, RLS verified (try as a different role), no console errors, typecheck + lint pass, acceptance criteria in the plan phase met.

## When unsure
Ask. Prefer the simplest thing that works on free tier. Don't add paid services or heavy libraries.
