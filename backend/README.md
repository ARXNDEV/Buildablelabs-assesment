# TaskFlow — Backend API

Node.js + Express + TypeScript REST API. Persists to **Supabase (Postgres)** and is the single
gatekeeper to the database — the mobile app and n8n both talk to *this*, never to Supabase directly.

## Tech
- Express 4 + TypeScript (ESM)
- `@supabase/supabase-js` (service-role client, server-side only)
- Zod for request validation, `pino-http` for logging
- Vitest + supertest for tests

## Setup

```bash
cd backend
cp .env.example .env      # fill in the values below
npm install
npm run dev               # http://localhost:8080
```

Apply the DB schema once: paste `../supabase/schema.sql` into the Supabase SQL Editor and Run.

### Environment (`.env`)
| var | notes |
|-----|-------|
| `SUPABASE_URL` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → **service_role** (secret, server-only) |
| `API_KEY` | shared secret; clients send it as `x-api-key`. Generate: `openssl rand -hex 32` |
| `PORT` | default `8080` |
| `CORS_ORIGIN` | `*` or a comma-separated allowlist |

## Auth
All `/api/*` routes require header `x-api-key: <API_KEY>`. `/health` is public.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | liveness (public) |
| GET | `/api/tasks` | list; filters: `status`, `priority`, `q`, `due_before`, `due_after`, `include_completed` |
| GET | `/api/tasks/:id` | fetch one |
| POST | `/api/tasks` | create (`title` required; `description`, `status`, `priority`, `due_at`, `source` optional) |
| PATCH | `/api/tasks/:id` | partial update; `status:'done'` stamps `completed_at` |
| DELETE | `/api/tasks/:id` | soft delete |
| GET | `/api/tasks/reminders` | open tasks overdue/due-today (daily Discord job) |
| POST | `/api/tasks/reminders/mark` | `{ ids: [...] }` → set `reminded_at` (dedupe) |
| GET | `/api/tasks/digest` | weekly rollup for the email digest |

Responses are `{ data, count? }` on success and `{ error: { message, code } }` on failure.

## Test / build

```bash
npm test          # vitest: auth gate, validation, schemas
npm run typecheck
npm run build && npm start
```

## Deploy (Render)
This repo includes a `Dockerfile` and `render.yaml` blueprint. In Render: **New → Blueprint**, pick
the repo, then set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `API_KEY` as environment
variables. Render health-checks `/health`.

## Example

```bash
curl -s localhost:8080/api/tasks \
  -H "x-api-key: $API_KEY" \
  -H 'content-type: application/json' \
  -d '{"title":"Ship it","priority":"high","due_at":"2026-07-03T09:00:00Z"}' \
  -X POST
```
