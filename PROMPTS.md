# Prompt Sharing

This project was built with **Claude Code** (Opus 4.8). This file documents *how* the AI was
driven — the prompting method, the actual prompts (lightly cleaned up), and the decisions they
produced — for the "prompt sharing" deliverable.

> **Shared session link:** _paste your Claude Code / claude.ai share link here_

## Prompting principles I applied

Every prompt below follows the same four rules, because they're what consistently produced
correct, review-ready code instead of plausible-looking drafts:

1. **Context + role, then constraints, then a done-definition.** Tell the model what it is, what
   it's working in (versions, existing files, security boundaries), and *how we'll know the task
   is finished* — before asking for a single line of code.
2. **Contract the output.** When the shape of the result matters (an API response, an LLM's JSON,
   a file layout), specify the schema and the failure behaviour, not just the happy path.
3. **Plan → approve → build.** Force a plan first, review it, and only then authorise code. Cheap
   to redirect on a plan; expensive to redirect on a finished module.
4. **Make it self-verify.** End tasks with "run X and paste the output" so the model closes its
   own loop (typecheck, tests, a headless bundle) instead of asserting success.

## How I worked with the AI

1. **Framed scope and success up front.** Picked Phase 1 (Mobile + Backend) + Phase 3 (n8n) and
   stated the optimisation target explicitly, then required clarifying questions before any code.
2. **Planned before building.** Had it produce an architecture + file-by-file plan and approved it,
   so the implementation had a spine and I could catch design issues early.
3. **Made it surface conflicts, not paper over them.** When it found an earlier partial build, the
   instruction was to *report the conflict and wait*, never to silently clobber work.
4. **Verified continuously.** Each layer ended in a real check — `tsc`, Vitest, `expo export` —
   with the output pasted back, so "done" always meant "observed working."

## Representative prompts

Each is written as a self-contained brief: **role → context → constraints → output → done-when.**

**Kickoff (scope + guardrails + clarify-first)**
> "Act as my senior engineer for the BuildableLabs assessment. I'm committing to **Phase 1
> (Mobile + Backend)** and **Phase 3 (n8n automation)**, and I'm optimising for *product quality* —
> best features and best UI, not the minimum that passes. Before you write any code: ask me the
> decisions that would be expensive to reverse — stack, messaging platform, hosting, and how email
> intake should work — then wait for my answers. Don't start until scope is locked."

**Architecture decision (force the trade-off, then commit)**
> "Decision needed: should the mobile app hit Supabase directly, or go through our own backend?
> Give me the two options as a short trade-off table — security, number of moving parts, and how
> cleanly n8n can integrate — then recommend one and justify it in two sentences." → Landed on
> **mobile → backend → Supabase**: the service-role key never leaves the server, and n8n gets a
> single, clean API surface instead of raw DB access.

**Backend (contract-first API)**
> "Build an **Express + TypeScript (ESM)** REST API for tasks. Contract: full CRUD with
> **soft-delete** (never hard-delete rows), **Zod** validation on every body, **x-api-key** auth on
> all `/api/*` routes, and a single consistent error envelope `{ error: { message, code } }` — 401
> on missing/bad key, 400 on invalid body. Add three automation endpoints the workflows will call:
> `/reminders`, `/reminders/mark`, `/digest`. Cover the security-critical paths with **Vitest** —
> auth gate and validation at minimum. **Done when** `npm test` is green and the server boots
> against a real Supabase project; paste both outputs."

**Mobile (honour the repo's own rules + a real UX bar)**
> "This repo has an `AGENTS.md` — read and obey it first. **Expo SDK 57 / RN 0.86 / React 19.2 is
> bleeding-edge, so read the *versioned* docs before choosing any library** and prefer stable
> primitives over convenience packages. Build the app with **Expo Router** + **TanStack Query**
> using **optimistic updates that reconcile on error**. UX bar: swipe-to-complete / swipe-to-delete
> with haptics, priority + due-date + a 'from email' source badge, filter tabs, search, stats, and
> light/dark mode. **Done when** `tsc --noEmit` is clean *and* `expo export` bundles the iOS app
> with every native module resolving — paste both."

**Automation (three workflows, importable, one design constraint)**
> "Author **three importable n8n workflow JSONs**: (1) **IMAP → Groq (`llama-3.3-70b-versatile`) →
> POST create task**; (2) a **daily Discord reminder** for overdue / due-today tasks that
> **de-duplicates** so a task is never pinged twice (use a `reminded_at` marker via
> `/reminders/mark`); (3) a **weekly HTML email digest** grouped by completed / pending / overdue /
> due-this-week / priority. Design constraint: **keep the Groq parsing inside n8n**, not in the
> backend, so the 'smart' step is visible in the automation and the create endpoint stays generic.
> Each file must import into n8n Cloud cleanly with placeholders for credentials."

**LLM parsing prompt (the Groq node — schema + few-shot + strict failure mode)**
> **System:**
> "You convert one email into one actionable task. Today is `{{ $now }}` in the user's timezone.
> Return **only** a single JSON object — no prose, no markdown fences — matching exactly this schema:
> ```json
> { "title": string,           // imperative, ≤ 80 chars
>   "description": string,      // one-line context, or ""
>   "priority": "low" | "medium" | "high",
>   "due_at": string | null }   // ISO-8601, or null if no clear due date
> ```
> Rules: infer `priority` from urgency language ('ASAP', 'urgent', 'when you get a chance');
> resolve relative dates against today ('by Friday', 'tomorrow 5pm', 'EOD') into absolute ISO-8601;
> use `null` for `due_at` when there is no defensible due date — never invent one. If the email is
> not actionable, return `{\"title\":\"\",...}` with an empty title so the workflow can skip it.
>
> **Examples**
> Input: 'Can you send the Q3 deck by Friday? Kind of urgent.'
> → `{\"title\":\"Send the Q3 deck\",\"description\":\"Requested via email\",\"priority\":\"high\",\"due_at\":\"2026-07-03T17:00:00Z\"}`
> Input: 'Thanks, talk soon!'
> → `{\"title\":\"\",\"description\":\"\",\"priority\":\"low\",\"due_at\":null}`"

## Decisions the AI and I landed on (and why)
- **mobile → backend → Supabase** — service key stays server-side; n8n gets one API surface.
- **x-api-key auth, single-user** — right-sized for the assessment; documented how real per-user
  auth (Supabase Auth + RLS keyed on `user_id`) would slot into the same gatekeeper.
- **Groq parsing in n8n, not the backend** — showcases the automation; backend stays generic.
- **Soft delete + `updated_at`** — no data loss, and a clean seam if Phase 2 (offline sync) were added.
- **StyleSheet + theme instead of NativeWind** — reliability on bleeding-edge RN 0.86 / React 19.2
  over a styling library with uncertain compatibility; same visual result, no version risk.
