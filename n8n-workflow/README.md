# TaskFlow — n8n Automation (Phase 3)

Three importable workflows. Each talks to the deployed backend over HTTPS.

The backend URL is **already set** to the live deployment
(`https://buildablelabs-assesment-1.onrender.com`). The remaining **placeholders** are secrets —
replace them after import (kept out of the repo on purpose):

| Placeholder | Replace with |
|-------------|--------------|
| `YOUR_BACKEND_API_KEY` | the backend `API_KEY` (paste into each HTTP node's `x-api-key` header) |
| `YOUR_GROQ_API_KEY` | your Groq API key |
| `https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN` | your Discord webhook URL |
| `YOUR_GMAIL@gmail.com` / `YOUR_EMAIL@example.com` | sender / recipient for the digest |

Import: n8n → **Workflows → Import from File** → pick the JSON → replace placeholders → set the
credentials noted below → **Activate**.

---

## 1 · Email → Task  (`1-email-to-task.json`)

`Email Received (IMAP)` → `Normalize Email` → `Groq · Parse Task` → `Build Task Payload` →
`Create Task (Backend)`.

Forward (or send) an email to a dedicated Gmail address; Groq extracts a clean title, priority, and
due date; the task is created with `source:"email"` (the mobile app shows a **"from email"** badge).

**Setup**
1. **Dedicated Gmail + IMAP:** in that Gmail account, enable 2-Step Verification, then create an
   **App Password** (Google Account → Security → App passwords). Enable IMAP (Gmail → Settings →
   Forwarding and POP/IMAP).
2. In n8n, create an **IMAP** credential (host `imap.gmail.com`, port `993`, SSL on, user = the
   address, password = the App Password) and select it on the *Email Received* node.
3. Replace `YOUR_GROQ_API_KEY` (Groq node) and the backend URL + `YOUR_BACKEND_API_KEY` (Create Task
   node).
4. Activate. **Test:** send an email like *"Pay the electricity bill by Friday 6pm"* → a task appears
   in the app within a minute.

> Model: `llama-3.3-70b-versatile` via Groq's OpenAI-compatible endpoint, `response_format:
> json_object` so the reply is strict JSON. Today's date is injected so relative dates ("tomorrow",
> "Friday") resolve correctly.

## 2 · Daily Reminders → Discord  (`2-daily-reminders.json`)

`Every day 09:00` → `Get Due / Overdue` → `Any tasks?` → `Build Reminder Message` →
`Post to Discord` → `Mark Reminded`.

Every morning it pulls `GET /api/tasks/reminders` (open tasks overdue or due today), posts a grouped
summary to Discord, then calls `POST /api/tasks/reminders/mark` so the same tasks aren't nagged
repeatedly.

**Setup**
1. **Discord webhook:** Server → *Edit Channel* → Integrations → Webhooks → *New Webhook* → Copy URL.
   Paste it into the *Post to Discord* node.
2. Replace backend URL + `YOUR_BACKEND_API_KEY` in both HTTP nodes.
3. Activate. **Test:** click *Execute Workflow* (or *Test step*) to fire immediately without waiting
   for 09:00.

> Cron `0 9 * * *`. Change the time in the *Every day 09:00* node. n8n Cloud uses your account's
> timezone (Settings → set it if needed).

## 3 · Weekly Digest → Email  (`3-weekly-digest.json`)

`Monday 08:00` → `Get Weekly Digest` → `Build Digest Email` → `Send Digest (SMTP)`.

Pulls `GET /api/tasks/digest` (completed-this-week, pending, overdue, due-this-week, by-priority) and
emails a styled HTML summary.

**Setup**
1. In n8n, create an **SMTP** credential — Gmail: host `smtp.gmail.com`, port `465`, SSL on, user =
   your Gmail, password = the **App Password** (same mechanism as above). Select it on the *Send
   Digest* node.
2. Set `fromEmail` / `toEmail` on that node; replace backend URL + `YOUR_BACKEND_API_KEY`.
3. Activate. **Test:** *Execute Workflow* to send immediately.

> Cron `0 8 * * 1` (Mondays 08:00).

---

## Notes & design choices
- **Secrets** are inline placeholders here purely to keep the exports self-contained and readable
  for review. In a real deployment, use n8n **credentials** / **variables** instead of literals
  (e.g. a *Header Auth* credential for `x-api-key`).
- Groq parsing lives **in n8n** (not the backend) so the "smart" step is visible in the automation
  and the backend keeps a single generic `POST /api/tasks`.
- The backend's `/reminders`, `/reminders/mark`, and `/digest` endpoints were built specifically so
  these workflows stay thin and don't need direct database access.

Screenshots of each workflow live in `./screenshots/` (add after importing).
