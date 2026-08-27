# LifeLine — Setup Guide (Phase 1 + Phase 2)

This turns the roadmap's Phase 0–2 into a working system: a website (Supabase-backed complaint
intake + auth), AI triage via Claude, WhatsApp routing, auto-escalation, and WiFi-down detection.

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
│   └── schema.sql         → run this once in Supabase
└── n8n/
    ├── phase1_triage_and_route.json   → AI triage + WhatsApp routing (1b + 1c)
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

## 3. n8n (20–30 minutes) — this is the "brain" that connects everything

You can self-host n8n free (`npx n8n`) or use [n8n.cloud](https://n8n.io)'s free tier. Either works.

### 3.1 Set environment variables in n8n
n8n → **Settings → Variables** (or `.env` if self-hosting):

| Variable | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `WHATSAPP_ACCESS_TOKEN` | Meta for Developers → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | same page as above |
| `MAINTENANCE_WHATSAPP_NUMBER` | the maintenance group/staff number, e.g. `9198XXXXXXXX` |
| `WARDEN_WHATSAPP_NUMBER` | the warden's number |
| `WIFI_GATEWAY_HEALTH_URL` | a URL your router/gateway always answers, e.g. `http://192.168.1.1` (Phase 2 only) |
| `WIFI_GATEWAY_LOCATION_LABEL` | e.g. `"B-Wing main gateway"` |

> **No WhatsApp Business API access yet?** Swap the two "Send WhatsApp" HTTP Request nodes for a
> **Twilio** node (Twilio's WhatsApp sandbox is free and takes 5 minutes to set up) or even a Slack/
> Telegram node for the hackathon demo — the rest of the workflow logic doesn't change.

### 3.2 Import the three workflows
In n8n: **Workflows → Import from File** → pick each JSON in `n8n/`, one at a time:
1. `phase1_triage_and_route.json`
2. `phase1d_escalation.json`
3. `phase2_wifi_monitor.json`

In each imported workflow, replace `YOUR-PROJECT-REF` in every Supabase URL with your actual project ref
(find it in your Supabase project URL).

### 3.3 Wire up Workflow 1 (triage + route) to fire on every new complaint
This is the one real "connection" step:
1. Open `phase1_triage_and_route.json` in n8n, click the **Webhook** trigger node, copy its **Production URL**.
2. In Supabase: **Database → Webhooks → Create a new webhook**
   - Table: `complaints`
   - Events: `Insert`
   - Type: `HTTP Request`
   - URL: paste the n8n webhook URL from step 1
3. **Activate** the workflow (toggle top-right in n8n).

Now: every new row in `complaints` (whether a student submitted it, or Phase 2's monitor auto-created it)
fires this workflow automatically. That's the "same pipeline fires automatically" behavior the roadmap
describes for WiFi detection.

### 3.4 Activate the other two
- `phase1d_escalation.json` — just activate it; its Schedule Trigger runs every hour on its own.
- `phase2_wifi_monitor.json` — just activate it; runs every 5 minutes on its own.

That's it — no more wiring needed. Both insert/update rows via the Supabase REST API using the
service_role key, which bypasses RLS (that's expected and safe — it never runs in the browser).

---

## 4. Test the whole loop end-to-end

1. Submit a complaint on `dashboard.html` with something like *"crack running across the washroom wall,
   getting bigger"* → within a few seconds its priority tag should flip from "Triaging…" to a real tag.
2. Check the n8n execution log for Workflow 1 — you'll see Claude's triage JSON and the WhatsApp send.
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
  WhatsApp "reply DONE" step here — same concept, just a real maintenance worker instead of a
  Streamlit button.
