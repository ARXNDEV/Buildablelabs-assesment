# Prompt Sharing

This project was built with **Claude Code** (Opus 4.8). This file documents how AI was used — the
approach, the key prompts, and the decisions that came out of them — for the "prompt sharing"
deliverable.

> **Shared session link:** _paste your Claude Code / claude.ai share link here_

## How I worked with the AI

1. **Framed the scope up front.** Chose Phase 1 (Mobile + Backend) + Phase 3 (n8n) and stated the
   goal explicitly: *"I want the best product, features- and UI-wise."* The assistant asked
   clarifying questions before writing code (stack, messaging platform, hosting, email intake).
2. **Plan before code.** Had it produce a full architecture + file-by-file plan and approved it
   before implementation, so the build had a clear spine.
3. **Let it discover and adapt.** It found an earlier partial build in the repo, surfaced the
   conflict instead of clobbering it, and only rebuilt after I confirmed the direction.
4. **Verify continuously.** After each layer it ran typecheck / tests / a headless bundle rather
   than assuming code worked.

## Representative prompts

**Kickoff**
> "I choose Phase 1 and Phase 3. I want this internship and I want the best product, features-wise
> and UI-wise."

**Architecture decision**
> "Should the mobile app talk to Supabase directly or go through the backend?" → decided
> **mobile → backend → Supabase**, keeping the service-role key server-side and giving n8n one clean
> API to call.

**Backend**
> "Build an Express + TypeScript API: tasks CRUD with soft-delete, zod validation, x-api-key auth,
> plus `/reminders`, `/reminders/mark`, and `/digest` endpoints for the n8n workflows. Add Vitest
> tests for the auth gate and validation."

**Mobile (respecting the repo's `AGENTS.md`)**
> "Expo SDK 57 is new — read the versioned docs first. Build the app with Expo Router, TanStack
> Query optimistic updates, swipe-to-complete/delete with haptics, priority + due-date + 'from
> email' badges, and light/dark mode."

**Automation**
> "Author three importable n8n workflows: IMAP → Groq (llama-3.3-70b) → create task; a daily
> Discord reminder that de-dupes; and a weekly HTML email digest. Keep the Groq parsing inside n8n
> so the smart step is visible."

**LLM parsing prompt (used inside the n8n Groq node)**
> System: *"You turn an email into a single actionable task. Today is {{date}}. Reply with ONLY a
> JSON object: {title, description, priority: low|medium|high, due_at: ISO8601|null}. Infer due_at
> from phrases like 'by Friday', 'tomorrow 5pm'; use null when there's no clear due date."*

## Decisions the AI and I landed on (and why)
- **mobile → backend → Supabase** — service key stays server-side; n8n gets one API surface.
- **x-api-key auth, single-user** — right-sized for the assessment; documented how real per-user
  auth (Supabase Auth + RLS) would slot in.
- **Groq parsing in n8n, not the backend** — showcases the automation; backend stays generic.
- **Soft delete + `updated_at`** — no data loss, and a clean seam if Phase 2 (offline sync) were added.
- **StyleSheet + theme instead of NativeWind** — reliability on bleeding-edge RN 0.86 / React 19.2
  over a styling library with uncertain compatibility; same visual result.
