# LifeLine — Setup Guide (Phase 1 + Phase 2)

This turns the roadmap's Phase 0–2 into a working system: a website (Supabase-backed complaint
intake + auth), AI triage via Gemini, Telegram routing, auto-escalation, and WiFi-down detection.

Everything here is **zero budget, zero hardware** — matches the roadmap exactly.

---

## 0. What you're deploying

```
lifeline/
├── index.html          → landing + student/staff login & registration
├── dashboard.html       → student portal: report an issue, see your reports
├── admin.html           → staff/warden console: see + update every complaint
├── config.js             → your Supabase URL + anon key go here
├── styles.css            → shared design system
├── supabase/
│   ├── schema.sql                  → run this once in Supabase
│   └── webhook_trigger_fallback.sql → only needed if Database Webhooks UI errors (see §3.5)
└── n8n/
    ├── phase1_triage_and_route.json   → AI triage + Telegram routing (1b + 1c)
    ├── phase1d_escalation.json        → reminders + warden escalation (1d)
    └── phase2_wifi_monitor.json       → WiFi gateway down-detection (Phase 2)
```

---

## 1. Supabase (10 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and run it.
   This creates `profiles`, `complaints`, storage bucket `complaint-photos`, and all RLS policies.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → paste into `config.js` as `SUPABASE_URL`
   - **anon public key** → paste into `config.js` as `SUPABASE_ANON_KEY`
   - **service_role key** → keep this secret, you'll paste it only into n8n (step 3), never into the website.
4. **Make your first staff/warden account:** register normally through the site as a student, then in
   Supabase go to **Table editor → profiles**, find your row, and change `role` from `student` to `warden`
   (or `staff`). Now that account can log into `admin.html`.
5. Optional but recommended: **Authentication → Providers → Email → turn off "Confirm email"** for the
   hackathon demo, so registration logs people in instantly (no inbox-checking mid-demo).

---

## 2. The website (5 minutes)

The site is plain HTML/JS — no build step, no framework, deploy it anywhere:

- **Fastest for a demo:** drag the `lifeline/` folder into [Netlify Drop](https://app.netlify.com/drop) or
  Vercel's "Deploy" → static folder upload. You get a live URL in under a minute.
- **From your own domain:** any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages) works — it's
  just static files.
- Test locally first if you want: `cd lifeline && python3 -m http.server 8000`, then open
  `http://localhost:8000`.

Flow to demo: register a student → submit a complaint with a photo → watch its priority tag update live
once n8n triages it → log in as warden on `admin.html` → change its status.

---

## 3. n8n.cloud (20–30 minutes) — this is the "brain" that connects everything

These workflows are already wired for **n8n.cloud** and **Telegram**, with your Supabase project ref
(`ksreqrxokmhrhcryflme`) baked into every REST URL — you don't need to find-and-replace anything.

### 3.1 Get a free Gemini API key
The Anthropic API needs a paid key, so triage runs on **Google Gemini's free tier** instead
(swap-in-place — same triage prompt, same JSON output):
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with any Google account.
2. Click **Create API key** → copy it. That's `GEMINI_API_KEY`.
3. Free tier is generous for a hackathon pilot (tens of requests/minute); if you ever outgrow it, this is
   the one node (`Gemini - AI Triage`) you'd repoint at a paid provider — nothing else in the workflow changes.

### 3.2 Get your Telegram bot token and chat IDs
1. In Telegram, message **@BotFather** → `/newbot` → follow the prompts → it gives you a token that
   looks like `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. That's `TELEGRAM_BOT_TOKEN`.
2. Decide who gets alerts:
   - **Maintenance:** create a Telegram group, add your bot to it, send any message in the group.
   - **Warden:** either the same group, or a 1:1 chat with the bot (the warden must message the bot
     first — bots can't message you until you've messaged them).
3. Get the chat ID: open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser right after
   sending that test message. Look for `"chat":{"id":  ... }` in the response — group IDs are usually
   negative numbers (e.g. `-4021xxxxxx`), personal chat IDs are positive.

### 3.3 Set environment variables in n8n.cloud
n8n.cloud → your instance → **Settings → Variables → Add Variable**:

| Variable | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `GEMINI_API_KEY` | aistudio.google.com/apikey (step 3.1) |
| `TELEGRAM_BOT_TOKEN` | from @BotFather (step 3.2) |
| `MAINTENANCE_TELEGRAM_CHAT_ID` | the maintenance group's chat ID (step 3.2) |
| `WARDEN_TELEGRAM_CHAT_ID` | the warden's chat ID (step 3.2) |
| `WIFI_GATEWAY_HEALTH_URL` | a URL your router/gateway always answers, e.g. `http://192.168.1.1` (Phase 2 only) |
| `WIFI_GATEWAY_LOCATION_LABEL` | e.g. `"B-Wing main gateway"` (Phase 2 only) |

> n8n.cloud free/starter plans sometimes restrict the Variables feature — if `Settings → Variables`
> isn't available on your plan, hardcode these values directly into each HTTP Request node instead
> (replace `{{ $env.TELEGRAM_BOT_TOKEN }}` etc. with the literal value in quotes).

### 3.4 Import the three workflows
In n8n.cloud: **Workflows → Import from File** (or drag-and-drop) → pick each JSON in `n8n/`, one at a time:
1. `phase1_triage_and_route.json`
2. `phase1d_escalation.json`
3. `phase2_wifi_monitor.json`

No placeholder cleanup needed — the Supabase URLs already point at your project.

### 3.5 Wire up Workflow 1 (triage + route) to fire on every new complaint
This is the one real "connection" step:
1. Open the imported **"LifeLine - Phase 1b+1c - Triage & Route (Telegram)"** workflow, click the
   **Webhook** trigger node, copy its **Production URL**.
2. In Supabase: **Database → Webhooks → Create a new webhook**
   - Table: `complaints`
   - Events: `Insert`
   - Type: `HTTP Request`
   - URL: paste the n8n webhook URL from step 1
3. **Activate** the workflow (toggle top-right in n8n).

> **Getting a "schema does not exist" error on that Webhooks page?** This is a known glitch in Supabase's
> Dashboard UI on some projects — it doesn't reliably provision the internal schema it needs. Skip the
> Dashboard entirely and run `supabase/webhook_trigger_fallback.sql` instead: it does the exact same
> job (POST the new row to your n8n webhook URL) via a plain Postgres trigger + the `pg_net` extension,
> which doesn't depend on that broken UI. Open the file, paste your n8n webhook URL in where it says
> `YOUR_N8N_WEBHOOK_URL` (both look identical — just the one placeholder, used once), then run the whole
> script in SQL Editor. The commented-out `insert` at the bottom is a one-line test you can run to confirm
> it's firing — check the n8n execution log after running it.

Now: every new row in `complaints` (whether a student submitted it, or Phase 2's monitor auto-created it)
fires this workflow automatically. That's the "same pipeline fires automatically" behavior the roadmap
describes for WiFi detection.

### 3.6 Activate the other two
- `phase1d_escalation.json` — just activate it; its Schedule Trigger runs every hour on its own.
- `phase2_wifi_monitor.json` — just activate it; runs every 5 minutes on its own.

That's it — no more wiring needed. Both insert/update rows via the Supabase REST API using the
service_role key, which bypasses RLS (that's expected and safe — it never runs in the browser).

---

## 4. Test the whole loop end-to-end

1. Submit a complaint on `dashboard.html` with something like *"crack running across the washroom wall,
   getting bigger"* → within a few seconds its priority tag should flip from "Triaging…" to a real tag.
2. Check the n8n execution log for Workflow 1 — you'll see Gemini's triage JSON and the Telegram send.
3. Manually stop your test "gateway" URL from responding (or temporarily point
   `WIFI_GATEWAY_HEALTH_URL` at something that 404s) → within 5 minutes Phase 2 should create a Network
   complaint with `source = auto_monitor`, and Workflow 1 should pick it up and triage it too.
4. In Supabase, manually backdate a test complaint's `created_at` to 3 days ago and set it back to
   `status = open` → run Workflow 1d manually (or wait an hour) → confirm a reminder fires, and further
   backdating triggers the warden escalation.

---

## 5. Where this sits in your pitch

- Phases 0–2 = your entire working MVP, all software, zero budget — exactly what's built here.
- Phase 3 (ESP32 sensors, smart plug) and Phase 4 (fire alarm, read-only) are "future scope" slides,
  not blockers — the roadmap PDF's framing is the right one to reuse in your deck.
- Your original hackathon prototype's "human-approval-before-action" design is literally the
  Telegram "reply DONE" step here — same concept, just a real maintenance worker instead of a
  Streamlit button.
