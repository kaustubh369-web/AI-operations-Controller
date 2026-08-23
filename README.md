# Self-Healing AI Operations Controller — Prototype
**SOAIDEATHON-S3**

A working prototype of a human-governed AIOps platform that correlates simulated
campus infrastructure signals, diagnoses root causes, recommends risk-ranked fixes,
previews them in a sandbox, requires human approval, and logs everything to an
audit trail — including graceful degradation when data sources go offline.

## What this demonstrates (mapped to the problem statement)

| Requirement | Where it is in the app |
|---|---|
| Correlates network logs, telemetry, alarms, IoT streams | `core.py` — 6 simulated devices with dependencies |
| Identifies likely root cause | "AI Diagnosis" panel — root cause + confidence % |
| Recommends safe recovery playbooks | "Recommended Playbook" panel |
| Ranks actions by risk | Each action tagged Low / Medium / High |
| Simulate/sandbox before execution | "🧪 Sandbox prediction" shown before Approve |
| Complete audit trail | Bottom table, backed by SQLite (`audit_trail.db`) |
| Explicit approval for high-impact actions | ✅ Approve / ❌ Reject buttons per action |
| Keeps working when sensors are unavailable | Sidebar "Graceful Degradation" — mark sources offline, watch confidence drop |

## How to run it

1. Install Python 3.9+ if you don't have it.
2. In this folder, install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   streamlit run app.py
   ```
4. It will open automatically at `http://localhost:8501` in your browser.

## Suggested demo flow (for your 3-minute video)

1. **Show healthy state** — all 6 devices green.
2. **Inject a fault** (sidebar) — e.g. "Database Overload". Watch the status turn red/orange.
3. **Run diagnosis** — AI shows root cause + confidence + evidence.
4. **Show the playbook** — point out the risk tags and the sandbox prediction text.
5. **Approve an action** — show it execute and the device return to green.
6. **Show the audit trail** — scroll to the bottom, point out every step was logged with a timestamp.
7. **Graceful degradation** — reset, inject another fault, but first mark 1-2 sources
   "OFFLINE" in the sidebar, then run diagnosis again — confidence visibly drops and a
   warning appears, but the system still gives an answer.

## Showing multiple faults at once

You're not limited to one fault at a time. Inject two or three from the sidebar
without resetting in between — each gets its own incident card with an independent
diagnosis, playbook, and approve/reject flow. This is a strong beat to add to the
video: it shows the platform handling concurrent incidents, not just a single
scripted failure.

Resolving one incident never masks another, even if they share an affected
device — e.g. "Power Fluctuation" and "HVAC Sensor Failure" both touch the HVAC
sensor, but approving a fix for one leaves the other's root cause untouched until
you resolve it too. Good combos to inject together for the demo:

- **Power Fluctuation** + **Database Overload** — shows two unrelated root causes
  diagnosed independently at the same time.
- **Power Fluctuation** + **HVAC Sensor Failure** — shows the shared-device
  protection described above (resolve one, the other stays flagged).

## Notes

- All data is simulated — no real infrastructure is touched. This is intentional for
  a hackathon prototype; the "Future Scope" is to plug in real connectors (Prometheus,
  SNMP, BMS systems) in place of `core.py`'s simulated fault library.
- The audit log persists in `audit_trail.db` (SQLite) even if you close and reopen the app.
  Use "Reset Everything" in the sidebar to clear it before recording a clean demo.
