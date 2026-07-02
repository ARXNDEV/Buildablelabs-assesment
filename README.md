# TaskFlow — Cross-Platform Task System + Automation

> BuildableLabs technical assessment. Chosen scope: **Phase 1 (Mobile + Backend)** and
> **Phase 3 (n8n Automation)** — built deep, wired together end-to-end.

A task manager that spans **mobile**, a **cloud backend**, and **automated workflows**. Create a
task on your phone *or* by forwarding an email; it persists to Supabase through a typed REST API;
you get a Discord reminder when it's due and an emailed digest every week.

```
┌────────────┐    HTTPS + x-api-key   ┌──────────────────┐   supabase-js   ┌────────────┐
│  Expo app  │ ─────────────────────> │  Express API     │ ──────────────> │  Supabase  │
│  (mobile)  │ <───────────────────── │  (Render, public)│ <────────────── │ (Postgres) │
└────────────┘     REST / JSON        └──────────────────┘                 └────────────┘
                                            ▲     ▲
                        HTTP (create/query) │     │ HTTP (query)
                                    ┌───────┘     └────────┐
                            ┌───────────────┐      ┌──────────────────────┐
                            │ n8n: Email→Task│      │ n8n: Reminders + Digest│
                            │ IMAP→Groq→POST │      │ Schedule→Discord/SMTP  │
                            └───────────────┘      └──────────────────────┘
```

**Live backend:** https://buildablelabs-assesment-1.onrender.com — try
[`/health`](https://buildablelabs-assesment-1.onrender.com/health). (`/api/*` needs the `x-api-key`
header. Free tier cold-starts in ~50s.)

**One-line demo story:** email → Groq parses it → backend → Supabase → shows in the mobile UI with a
"from email" badge → Discord reminder when due → weekly email digest. Every hop is demonstrable.

## Repository layout

| Path | What |
|------|------|
| [`/backend`](./backend) | Express + TypeScript REST API (deployed to Render) |
| [`/mobile`](./mobile) | React Native (Expo SDK 57) app |
| [`/n8n-workflow`](./n8n-workflow) | 3 importable n8n workflows + setup guide |
| [`/supabase`](./supabase) | `schema.sql` — apply once to your project |
| [`PROMPTS.md`](./PROMPTS.md) | AI prompts / approach (prompt-sharing deliverable) |

## Tech stack
- **Mobile:** Expo SDK 57, Expo Router, TanStack Query, Reanimated + Gesture Handler, expo-haptics
- **Backend:** Node 20+, Express 4, TypeScript (ESM), Zod, `@supabase/supabase-js`, pino
- **Database:** Supabase (Postgres) with a soft-delete + `updated_at` trigger
- **Automation:** n8n Cloud — IMAP, HTTP, Schedule, Code, Discord webhook, SMTP
- **LLM:** Groq (`llama-3.3-70b-versatile`) for smart email → task parsing

## Setup (end to end)

### 0. Database
Supabase → SQL Editor → paste [`supabase/schema.sql`](./supabase/schema.sql) → Run.

### 1. Backend
```bash
cd backend
cp .env.example .env        # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_KEY
npm install
npm test                    # 10 tests: auth gate, validation, schemas
npm run dev                 # http://localhost:8080
```
Then **deploy to Render** (a `Dockerfile` + `render.yaml` are included): New → Blueprint → this repo
→ set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY`. Copy the resulting public URL.

### 2. Mobile
```bash
cd mobile
cp .env.example .env        # EXPO_PUBLIC_API_URL = Render URL, EXPO_PUBLIC_API_KEY = backend API_KEY
npm install                 # needs Node 22.13+ to run the dev server (Expo SDK 57)
npm start                   # scan the QR in Expo Go
```

### 3. Automation
Import the three files in [`/n8n-workflow`](./n8n-workflow), replace the placeholders, wire the
Gmail IMAP / SMTP / Discord / Groq credentials (full guide in that folder's README), and activate.

## What's implemented

**Phase 1**
- Full CRUD + check-off from mobile; changes hit the backend immediately (optimistic UI + reconcile).
- Typed REST API with validation, consistent error envelope, API-key auth, soft delete.
- Priority, due dates, task source; filter tabs, search, stats, swipe gestures, dark mode.

**Phase 3**
- **Email → task** with Groq parsing (title/priority/due date), tagged `source:"email"`.
- **Daily Discord reminders** for overdue / due-today tasks, de-duplicated via `reminded_at`.
- **Weekly HTML email digest** (completed / pending / overdue / due-this-week / by priority).

## Key decisions & trade-offs
- **mobile → backend → Supabase (not direct):** the service-role key never leaves the server, and
  n8n gets a single clean API. Cost: one extra hop.
- **API-key auth, single-user scope:** right-sized for the assessment. Real multi-user auth would be
  Supabase Auth + Row Level Security keyed on `user_id` — the schema already isolates the API as the
  gatekeeper, so it slots in cleanly.
- **Groq parsing in n8n, not the backend:** keeps the "smart" step visible in the automation and the
  create endpoint generic.
- **Soft delete + `updated_at`:** no data loss and a natural seam had we also done Phase 2 (offline
  sync + conflict resolution).
- **StyleSheet + a theme system instead of NativeWind:** deliberate — on bleeding-edge RN 0.86 /
  React 19.2, a styling lib is a compatibility risk; tokens give the same result reliably.

## Verification done
- Backend: `npm test` green (10 tests); server boots; `/health` ok; 401 without key; 400 on bad body.
- Mobile: `tsc --noEmit` clean; `expo export` bundles the full iOS app (all native modules resolve).
- n8n: all three workflow JSONs validated as importable.
- **Live:** backend deployed to Render — `/health`, full CRUD, soft-delete, and the auth gate all
  verified against the live Supabase database.

## Prompt sharing
See [`PROMPTS.md`](./PROMPTS.md). Claude Code session link: _(add on submission)_.
