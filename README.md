# Self-Healing AI Operations Controller — Prototype
**SOAIDEATHON-S3**

A working prototype of a human-governed AIOps platform that correlates simulated
campus infrastructure signals, diagnoses root causes, recommends risk-ranked fixes,
previews them in a sandbox, requires human approval, and logs everything to an
audit trail — including graceful degradation when data sources go offline, and an
opt-in AI narration layer that explains diagnoses in plain language without ever
being allowed to invent facts.

## What this demonstrates (mapped to the problem statement)

| Requirement | Where it is in the app |
|---|---|
| Correlates network logs, telemetry, alarms, IoT streams | `core.py` — 6 simulated devices with dependencies |
| Identifies likely root cause | "AI Diagnosis" panel — root cause + confidence gauge |
| Recommends safe recovery playbooks | "Recommended Playbook" panel |
| Ranks actions by risk | Each action tagged Low / Medium / High |
| Simulate/sandbox before execution | Instant "🧪 Sandbox prediction" shown before Approve |
| Complete audit trail | Bottom "terminal" log, backed by SQLite (`audit_trail.db`) |
| Explicit approval for high-impact actions | ✅ Approve / ❌ Reject buttons per action |
| Keeps working when sensors are unavailable | Control Deck "Step 02 — Degrade Sensors" — mark sources offline, watch confidence drop |

## Architecture — why the AI can't hallucinate a root cause

This is the design decision worth highlighting to judges. The system is split into
two layers with a hard boundary between them:

1. **`core.py` — the deterministic rule engine.** This is the *only* thing that
   ever decides what the root cause is, how confident the system should be, or
   which recovery actions exist. It's plain Python: dependency graphs, threshold
   checks, and a fixed playbook per fault type. There is nothing here for a
   language model to get wrong, because there's no language model here at all.
2. **`ai_engine.py` — an optional, additive narration layer.** When you set
   `ANTHROPIC_API_KEY`, an "🤖 Ask AI to explain this" button appears next to a
   diagnosis or a recommended action. Clicking it sends Claude *only* the
   structured facts `core.py` already computed — the root cause, the confidence
   number, the current sensor readings, the one fixed action and its
   deterministic sandbox prediction — with an explicit instruction to restate
   those facts in plain operator language and never introduce a new device,
   number, or action. The model has nothing to hallucinate *about*, because
   everything it's allowed to talk about is already fixed before the call is
   made.

If no API key is set, the "AI NARRATION" indicator in the header switches to
OFFLINE and the app runs exactly as before on rule-engine evidence alone —
nothing about correctness ever depends on the AI call succeeding. AI narration
is also opt-in per button click rather than automatic, so the demo stays fast:
diagnosis and sandbox prediction are instant either way.

## Look and feel

The UI ("Substation" theme, in `style.py`) is built around a campus
network-operations-center console rather than a generic dashboard: indicator-lamp
device tiles, a segmented confidence gauge, a monospace terminal-style audit log,
and a dashed cyan border that visually fences off anything the AI wrote from the
rule engine's own facts, so it's always obvious on screen which is which.

## How to run it

1. Install Python 3.9+ if you don't have it.
2. In this folder, install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. *(Optional)* Enable AI narration by setting your Anthropic API key before launch:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...      # macOS/Linux
   set ANTHROPIC_API_KEY=sk-ant-...         # Windows (cmd)
   ```
   Skip this step and the app runs fine in rule-engine-only mode.
4. Run the app:
   ```bash
   streamlit run app.py
   ```
5. It will open automatically at `http://localhost:8501` in your browser.

> If deploying on Streamlit Community Cloud, add `ANTHROPIC_API_KEY` under
> **App settings → Secrets** instead of a local `export`.

## Suggested demo flow (for your 3-minute video)

1. **Show healthy state** — all 6 device tiles green, header shows AI NARRATION
   status (ON or OFF is fine — the story works either way).
2. **Inject a fault** (Control Deck, Step 01) — e.g. "Database Overload". Watch
   the tile and severity strip turn red/orange.
3. **Run diagnosis** — the AI Diagnosis panel shows root cause, the segmented
   confidence gauge, and the rule engine's evidence text.
4. *(If AI is on)* **Click "Ask AI to explain this diagnosis"** — point out the
   dashed cyan box and say out loud: "this box can only restate the facts you
   just saw above it — it can't add a new cause or a new number."
5. **Show the playbook** — point out the risk tags and the instant sandbox
   prediction text; optionally click "AI rationale" on one option.
6. **Approve an action** — show it execute and the device return to green.
7. **Show the audit trail** — scroll to the terminal-style log at the bottom,
   point out every step was logged with a timestamp.
8. **Graceful degradation** — reset, inject another fault, but first mark 1-2
   sources OFFLINE in Step 02, then run diagnosis again — confidence visibly
   drops and a warning appears, but the system still gives an answer.

## Showing multiple faults at once

You're not limited to one fault at a time. Inject two or three from the Control
Deck without resetting in between — each gets its own incident card with an
independent diagnosis, playbook, and approve/reject flow. This is a strong beat
to add to the video: it shows the platform handling concurrent incidents, not
just a single scripted failure.

Resolving one incident never masks another, even if they share an affected
device — e.g. "Power Fluctuation" and "HVAC Sensor Failure" both touch the HVAC
sensor, but approving a fix for one leaves the other's root cause untouched until
you resolve it too. Good combos to inject together for the demo:

- **Power Fluctuation** + **Database Overload** — shows two unrelated root causes
  diagnosed independently at the same time.
- **Power Fluctuation** + **HVAC Sensor Failure** — shows the shared-device
  protection described above (resolve one, the other stays flagged).

## Project files

| File | Role |
|---|---|
| `app.py` | Streamlit UI — page layout, session state, wiring buttons to `core.py` / `ai_engine.py` |
| `core.py` | Deterministic rule engine — topology, fault library, correlation, playbooks, sandbox, SQLite audit log |
| `ai_engine.py` | Optional grounded AI narration layer (see Architecture above) |
| `style.py` | "Substation" design system — CSS tokens + HTML render helpers for tiles/gauges/terminal |
| `requirements.txt` | `streamlit` (required) + `anthropic` (optional, for AI narration) |
| `.streamlit/config.toml` | Base dark theme so native widgets match the custom CSS |

## Notes

- All data is simulated — no real infrastructure is touched. This is intentional for
  a hackathon prototype; the "Future Scope" is to plug in real connectors (Prometheus,
  SNMP, BMS systems) in place of `core.py`'s simulated fault library, and to extend
  the AI layer toward retrieval over historical incident data for richer, still-grounded
  narration — not toward letting the model decide root causes on its own.
- The audit log persists in `audit_trail.db` (SQLite) even if you close and reopen the app.
  Use "♻️ Reset Everything" in the Control Deck to clear it before recording a clean demo.
