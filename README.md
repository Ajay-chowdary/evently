# Evently

Event discovery + ticketing platform: poster-style discovery feed, organizer
dashboard, Stripe-backed checkout, transactional email + QR ticket passes.

## Stack

- **Next.js 16** (App Router, server actions, `@sentry/nextjs`)
- **TypeScript**, **Tailwind CSS v4**, **Radix UI**, Framer Motion
- **Prisma** + **Postgres** (Supabase-hosted)
- **Supabase Auth** (email/password + Google OAuth) — `next-auth` is no longer used
- **Supabase Storage** for event images
- **Stripe Checkout** for paid tickets, **Resend** for transactional email
- **Upstash Redis** for rate limiting
- **Vitest** for unit tests, **GitHub Actions** for CI

## Setup

```bash
cp .env.example .env.local
# Fill in the values — see comments in .env.example for what each one does.

npm install
npx prisma generate
# Apply migrations (see "Migration history" below for the current state).
# Seed sample data (optional; uses DIRECT_URL):
npm run db:seed

npm run dev
```

Open <http://localhost:3000>.

### Quick "demo mode" (no Stripe / Supabase keys)

Set `NEXT_PUBLIC_USE_MOCK_CATALOG=true` in `.env.local`. The catalog reads
from hard-coded seed data, the organizer-demo wizard persists events to
localStorage, and checkout uses a mock flow that issues a QR pass without
charging. **Keep this `false` in production** — the production routes have
intentional fallback gates so a misconfigured deploy will not silently route
real users into client-only flows.

## Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Development server (Webpack)           |
| `npm run build`      | Production build (Webpack)             |
| `npm run start`      | Start the built app                    |
| `npm run lint`       | ESLint                                 |
| `npm run typecheck`  | `tsc --noEmit`                         |
| `npm test`           | Vitest unit tests (run once)           |
| `npm run test:watch` | Vitest in watch mode                   |
| `npm run db:migrate` | `prisma migrate dev`                   |
| `npm run db:seed`    | Seed sample events                     |

## Project structure

```
src/
  app/                      # Routes (App Router)
    api/checkout            # Creates Stripe Checkout sessions
    api/webhooks/stripe     # Confirms / expires bookings on Stripe events
    api/health              # Liveness + DB ping (used by uptime probes)
    api/location/suggest    # Google Places autocomplete proxy
    bookings/               # User's bookings + ticket pass
    dashboard/              # Organizer-owned event mgmt (real DB path)
    events/                 # Public event discovery + checkout
    organizer-demo/         # Demo wizard (localStorage; client-only)
  actions/                  # Server actions (events, tickets, etc.)
  components/               # UI components
  lib/
    auth.ts                 # Supabase Auth → app User sync; ensureCallerIsOrganizer
    booking-engine/         # Pure pricing/validation (well unit-tested)
    email.ts                # Resend wrapper (HTML-escaped, header-sanitized)
    errors.ts               # Shared error classes (e.g. ImageUploadError)
    logger.ts               # Tiny structured JSON logger
    ratelimit.ts            # Upstash rate limiter (no-op fallback when unset)
prisma/
  schema.prisma
  migrations/               # See "Migration history"
.github/workflows/ci.yml    # Lint + typecheck + test + build
```

## Production checklist

This codebase is wired for prod but a few things are environment-specific
and must be set up by hand. See [`.env.example`](.env.example) for the full
env-var reference.

| Step | Where |
| -- | -- |
| Set Stripe webhook URL → `https://YOUR_DOMAIN/api/webhooks/stripe` | Stripe Dashboard → Webhooks |
| Verify your Resend `from` domain (DNS records) | Resend Dashboard |
| Apply RLS policy migration (see Security) | Supabase SQL editor / `psql $DIRECT_URL` |
| Configure Auth rate limits (signup/password reset) | Supabase Dashboard → Project Settings → Auth → Rate Limits |
| Restrict Google Maps keys (IP + HTTP referrer) | Google Cloud Console |
| Set `SENTRY_AUTH_TOKEN` so build uploads sourcemaps | Vercel env |
| Set `UPSTASH_REDIS_REST_URL` + `..._TOKEN` so rate limiting is enforced | Vercel env |

## Security

### Row Level Security

A migration at
[`prisma/migrations/20260506000002_rls_policies/migration.sql`](prisma/migrations/20260506000002_rls_policies/migration.sql)
enables RLS on every public-facing table and creates policies for both
anonymous and authenticated reads/writes. The migration is idempotent — safe
to run repeatedly.

Trust model:
- **Prisma** connects via the privileged Postgres role and bypasses RLS, so
  all server actions / API routes continue to work.
- **Supabase JS service-role client** also bypasses RLS — used for Stripe
  webhooks, image uploads, and other server-only writes.
- **Supabase JS anon / authenticated client** is the gated path. Public
  `/events` reads use the anon client and are subject to the policies.

To apply:

```bash
psql "$DIRECT_URL" -f prisma/migrations/20260506000002_rls_policies/migration.sql
```

### Rate limiting

[`src/lib/ratelimit.ts`](src/lib/ratelimit.ts) wraps `@upstash/ratelimit`.
Limiters are wired into `/api/checkout`, `/api/webhooks/stripe`, and
`/api/location/suggest`. Without `UPSTASH_REDIS_REST_*` env vars set, the
limiter no-ops and logs a single warning on first use.

Auth (signup / password reset / signin) goes directly to Supabase Auth from
the browser — those rate limits must be configured in the **Supabase Dashboard
→ Project Settings → Auth → Rate Limits**, not in this codebase.

## Observability

- **Sentry**: configured at [`src/instrumentation.ts`](src/instrumentation.ts)
  +
  [`src/sentry.server.config.ts`](src/sentry.server.config.ts)
  /
  [`src/sentry.edge.config.ts`](src/sentry.edge.config.ts)
  /
  [`src/instrumentation-client.ts`](src/instrumentation-client.ts).
  Init is gated on the DSN being set so dev/test are unaffected.
- **Health check**: `GET /api/health` returns `{ ok, ts, dbOk, uptimeSec, commit }`.
  Hook this into Vercel / Pingdom / etc.
- **Structured logger**: `src/lib/logger.ts`. In production every log is one
  JSON line; in dev it's plain text.

## Migration history

The repo currently contains 5 migration files written for SQLite (`PRAGMA`,
`DATETIME`, etc.) — those migrations were never applied to the live Postgres
DB. Two new Postgres-flavored migrations have been added:

- `20260506000001_booking_sweeper_index/` — index for the PENDING_PAYMENT sweeper
- `20260506000002_rls_policies/` — RLS

Before running `prisma migrate dev` again, baseline the history:

```bash
# 1. Move/delete the SQLite migration directories
# 2. Generate one squashed migration that matches current live schema:
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_baseline/migration.sql

# 3. Mark it as already applied so prisma doesn't try to run it:
npx prisma migrate resolve --applied <timestamp>_baseline
```

After that, the two new migrations above can be applied normally with
`npx prisma migrate deploy`.

## Known follow-ups

- Stripe → Resend: paid-checkout confirmation email is not yet sent from
  the webhook. (Free RSVP path does send.)
- PENDING_PAYMENT sweeper cron not yet wired up. The index is in place;
  add a Vercel cron + a route handler to expire stale Stripe sessions.
- E2E tests (Playwright) are not set up. Unit tests cover the booking engine
  pricing + validation; webhook handler tests are TODO.
