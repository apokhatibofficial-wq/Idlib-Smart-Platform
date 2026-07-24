# منصة إدلب الذكية — Idlib Smart Platform

A production-grade Progressive Web App for Idlib governorate: citizen complaints/reports,
a local marketplace, merchant-citizen chat, an Idlib-scoped AI assistant, and admin
moderation — all backed by a real NestJS + PostgreSQL API (no mock data).

## Tech stack

**Frontend** (`apps/web`) — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui (via the `radix-ui` package) · Motion · React Hook Form + Zod · TanStack Query ·
full PWA (offline caching, Web Push, Background Sync), Arabic RTL throughout.

**Backend** (`apps/api`) — NestJS 11 · PostgreSQL via Prisma · Redis (sessions/OTP
throttling/BullMQ queues) · JWT (access + refresh, rotation with reuse detection) ·
Google OAuth · Email OTP · RBAC · audit logging.

**Security** — Argon2id password hashing, AES-256-GCM field-level encryption for
whistleblower bribery-report data, double-submit-cookie CSRF, per-route + account-level
rate limiting, Helmet/CSP on both apps, magic-byte file validation, input sanitization
on every free-text field, httpOnly/secure/signed cookies.

## Repository layout

```
apps/
  api/    NestJS API — modules/controllers/services/DTOs, Prisma schema, seed script
  web/    Next.js PWA — App Router, service worker, offline queue, push notifications
docker-compose.yml   Postgres + Redis for local dev
```

The two apps are plain npm workspaces with no shared package — API response types are
hand-mirrored in `apps/web/src/types/api.ts` rather than imported, by design (keeps the
frontend buildable independent of the API's internal types).

## Prerequisites

- Node.js ≥ 20.9
- PostgreSQL 15+ and Redis 7+ (either via `docker compose up -d postgres redis`, or
  your own local/managed instances)

## Setup

```bash
npm install

# Copy env templates and fill in real values (see "Environment variables" below)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm run docker:up          # or point DATABASE_URL/REDIS_URL at your own instances

npm run db:generate
npm run db:migrate
npm run db:seed            # creates the demo accounts listed below

npm run dev:api            # http://localhost:4000  (Swagger at /docs in dev)
npm run dev:web            # http://localhost:3000
```

## Environment variables

Every variable is documented inline in `apps/api/.env.example` and
`apps/web/.env.example`. The ones that matter most to get running locally:

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `REDIS_URL` | api | Redis connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `COOKIE_SECRET` | api | `openssl rand -base64 48` each — must differ |
| `FIELD_ENCRYPTION_KEY` | api | `openssl rand -base64 32` — encrypts bribery-report whistleblower fields at rest |
| `NEXT_PUBLIC_API_ORIGIN` / `API_ORIGIN` | web | Must point at the running API; the browser-facing one is also used for the direct chat WebSocket connection |

**Not configured out of the box** (the app degrades gracefully — see below — rather than
failing to boot):

- `SMTP_*` — GoDaddy/Workspace Email credentials for OTP and notification emails
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth sign-in
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push notifications

Without SMTP configured, OTP codes and emails are logged to the API console instead of
sent. Without VAPID keys, the push-subscribe endpoint returns a clear "not enabled"
error and the frontend's notification toggle reports itself as unavailable. Without
Google OAuth credentials, the "sign in with Google" button will fail at Google's end
until real credentials are supplied — email/password + OTP sign-up works regardless.

## Demo accounts

Seeded by `npm run db:seed`, all with password `Idlib@2026`:

| Email | Role |
|---|---|
| `admin@idlib-smart.sy` | Admin |
| `ahmad@mail.com` | Citizen |
| `shaam@mail.com`, `reem@mail.com`, `alnoor@mail.com`, `shifa@mail.com` | Merchant (approved stores) |
| `khaled@mail.com`, `rana@mail.com`, `wael@mail.com` | Citizen (pending business-account requests, for testing admin approval) |

## Scripts

Run from the repo root (npm workspaces):

- `npm run dev:api` / `dev:web` — start each app in watch mode
- `npm run build:api` / `build:web` — production builds
- `npm run typecheck:api` / `typecheck:web` — `tsc --noEmit`
- `npm run lint:api` / `lint:web` — ESLint (+ Prettier via `eslint-plugin-prettier`)
- `npm run db:generate` / `db:migrate` / `db:seed` — Prisma workflow
- `npm run docker:up` / `docker:down` — local Postgres + Redis

## Architecture notes

- **Clean Architecture / Repository pattern** on the API: controllers stay thin, all
  business logic and Prisma access lives in services, DTOs validate every input
  (`class-validator`, `whitelist: true` + `forbidNonWhitelisted: true` globally).
- **Global cross-cutting concerns** are wired once in `app.module.ts`: a global
  `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard` chain (every route requires auth
  unless `@Public()`; every role-restricted route needs an explicit `@Roles()`), plus
  logging/audit-log/response-transform interceptors and a single exception filter that
  guarantees internal errors never leak stack traces to clients.
- **Auth**: JWT access (15m) + refresh (30d) tokens in httpOnly signed cookies, refresh
  rotation with reuse detection (a replayed, already-rotated refresh token revokes the
  whole session), Argon2id password hashing, Redis-backed account lockout after 5 failed
  logins independent of the per-IP rate limiter.
- **PWA**: hand-written `apps/web/public/sw.js` (no Workbox) — network-first navigation
  with an offline fallback page, cache-first static assets, API calls always bypass the
  cache. Complaint submissions made while offline are queued in IndexedDB and replayed
  automatically via Background Sync (with a page-context fallback flush for browsers
  without Background Sync support, e.g. Safari).
- **Realtime chat** authenticates its WebSocket connection with a short-lived,
  single-purpose JWT ticket (issued over the authenticated REST session) rather than
  the httpOnly auth cookie, since a raw WS handshake to the API's own origin can't read
  an httpOnly cookie set through the Next.js proxy.

## Security

Implemented and verified: Argon2id hashing, AES-256-GCM field encryption for bribery
whistleblower data (decrypted only for `ADMIN`), double-submit-cookie CSRF on every
unsafe request, per-route rate limiting (auth endpoints) plus a global default, Redis
account-lockout brute-force protection, Helmet + a nonce-based strict CSP on both apps,
`sanitize-html` on every free-text field, magic-byte file-signature validation on
uploads (never trusts client-supplied MIME type), httpOnly/secure/signed/sameSite
cookies, RBAC enforced both at the API (guards) and in Next.js (server-rendered layout
checks — the API is the real boundary; the frontend checks are UX, not the security
boundary), and resource-ownership checks (not just role checks) on every endpoint that
returns a specific citizen's/merchant's data.

## Testing

No automated test suite is included yet. Every major flow (registration/OTP/login,
RBAC, CSRF rejection, complaint submission + encrypted bribery fields + role-gated
decryption, marketplace ordering, realtime chat, the AI assistant, business-account
approval, merchant CRUD, admin moderation, offline queueing, and the two authorization
fixes noted in the git history) was verified end-to-end against a real Postgres/Redis/
API/Next.js stack using Playwright during development.
