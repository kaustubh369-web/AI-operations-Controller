"""
style.py — visual design system for the Self-Healing AI Operations Controller.

Theme: "Substation" — a campus network-operations-center console. The palette
and type choices are drawn from real NOC/SCADA hardware (indicator lamps,
blueprint schematics, monospace telemetry readouts) rather than a generic
dashboard look. This module owns all CSS + small HTML render helpers so
app.py stays focused on state and logic.
"""

import html

# ---------------------------------------------------------------------------
# DESIGN TOKENS
# ---------------------------------------------------------------------------
TOKENS = {
    "ink":        "#0A0F1C",   # Substation Navy   — app background
    "panel":      "#111A2E",   # Console Slate     — card/panel surface
    "panel_hi":   "#16233C",   # slightly lifted panel (hover / nested)
    "line":       "#22314F",   # Blueprint Line    — hairlines, grid rules
    "text":       "#E8ECF4",   # Signal White      — primary text
    "text_dim":   "#8592AC",   # Static Grey       — secondary text
    "ok":         "#33D6A6",   # Uptime Green
    "warn":       "#F5A623",   # Caution Amber
    "crit":       "#FF5C6C",   # Alarm Red
    "ai":         "#4FD1FF",   # Diagnostic Cyan   — reserved ONLY for AI-authored text
}

STATUS_COLOR = {"OK": TOKENS["ok"], "DEGRADED": TOKENS["warn"], "CRITICAL": TOKENS["crit"], "DOWN": TOKENS["crit"]}


def inject_css(device_count: int = 6) -> str:
    t = TOKENS
    return f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {{
  --ink: {t['ink']}; --panel: {t['panel']}; --panel-hi: {t['panel_hi']};
  --line: {t['line']}; --text: {t['text']}; --text-dim: {t['text_dim']};
  --ok: {t['ok']}; --warn: {t['warn']}; --crit: {t['crit']}; --ai: {t['ai']};
}}

html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {{
  background-color: var(--ink) !important;
  color: var(--text);
}}
[data-testid="stHeader"] {{ background: transparent !important; }}
[data-testid="stAppViewContainer"] * {{ font-family: 'Inter', sans-serif; }}

/* ---- layout scaffolding ---- */
.block-container {{ padding-top: 1.4rem; max-width: 1200px; }}
hr, [data-testid="stDivider"] {{ border-color: var(--line) !important; opacity: 1; }}

/* ---- headline / callsign bar ---- */
.ops-header {{
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid var(--line); background: linear-gradient(180deg, var(--panel), var(--ink));
  border-radius: 6px; padding: 18px 22px; margin-bottom: 6px;
}}
.ops-title {{
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.55rem;
  letter-spacing: 0.01em; margin: 0; color: var(--text);
}}
.ops-sub {{ color: var(--text-dim); font-size: 0.86rem; margin-top: 2px; }}
.ops-callsign {{
  font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: var(--ok);
  border: 1px solid var(--ok); border-radius: 4px; padding: 5px 10px; letter-spacing: 0.06em;
  white-space: nowrap;
}}
.ops-callsign.dim {{ color: var(--text-dim); border-color: var(--line); }}

/* ---- eyebrow section labels (sidebar control deck) ---- */
.deck-eyebrow {{
  font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.12em;
  color: var(--ai); margin: 14px 0 6px 0; text-transform: uppercase;
  border-bottom: 1px dashed var(--line); padding-bottom: 6px;
}}
section[data-testid="stSidebar"] {{
  background-color: var(--panel) !important; border-right: 1px solid var(--line);
}}
section[data-testid="stSidebar"] * {{ color: var(--text) !important; }}

/* ---- device tiles ---- */
.tile-grid {{ display: grid; grid-template-columns: repeat({device_count}, 1fr); gap: 10px; }}
.tile {{
  border: 1px solid var(--line); background: var(--panel); border-radius: 6px;
  padding: 12px 10px; position: relative; overflow: hidden;
}}
.tile.offline {{ opacity: 0.45; }}
.tile-top {{ display: flex; align-items: center; justify-content: space-between; }}
.tile-glyph {{ font-size: 1.1rem; }}
.led {{ width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }}
.led.pulse {{ animation: pulse 1.1s ease-in-out infinite; }}
@keyframes pulse {{ 0%,100% {{ opacity: 1; }} 50% {{ opacity: 0.35; }} }}
.tile-name {{ font-size: 0.74rem; color: var(--text-dim); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.04em; }}
.tile-reading {{ font-family: 'IBM Plex Mono', monospace; font-size: 1.15rem; font-weight: 600; margin-top: 1px; }}
.tile-status {{ font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; margin-top: 4px; letter-spacing: 0.05em; }}

/* ---- incident severity strip ---- */
.sev-strip {{
  display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-radius: 5px 5px 0 0;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.74rem; letter-spacing: 0.06em;
  border: 1px solid var(--line); border-bottom: none;
}}
.sev-dot {{ width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }}

/* ---- confidence gauge ---- */
.gauge-wrap {{ display: flex; align-items: center; gap: 8px; margin: 4px 0 2px 0; }}
.gauge {{ display: flex; gap: 3px; }}
.gauge-seg {{ width: 10px; height: 14px; border-radius: 2px; background: var(--line); }}
.gauge-seg.on {{ background: var(--seg-color, var(--ok)); }}
.gauge-pct {{ font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; color: var(--text-dim); }}

/* ---- AI narration block — visually fenced off from rule-engine facts ---- */
.ai-block {{
  border: 1px dashed var(--ai); border-radius: 6px; padding: 10px 12px; margin-top: 8px;
  background: rgba(79, 209, 255, 0.06);
}}
.ai-label {{
  font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; color: var(--ai);
  letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; display: block;
}}
.ai-text {{ font-size: 0.88rem; color: var(--text); line-height: 1.45; }}
.ai-unavailable {{ font-size: 0.8rem; color: var(--text-dim); font-style: italic; }}

/* ---- audit terminal ---- */
.term {{
  border: 1px solid var(--line); background: #070B14; border-radius: 6px;
  padding: 10px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem;
  max-height: 360px; overflow-y: auto;
}}
.term-row {{ display: grid; grid-template-columns: 150px 190px 1fr; gap: 10px; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }}
.term-ts {{ color: var(--text-dim); }}
.term-detail {{ color: var(--text); word-break: break-word; }}

/* ---- badges (risk tags) ---- */
.badge {{
  display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem;
  padding: 2px 8px; border-radius: 3px; letter-spacing: 0.05em; border: 1px solid currentColor;
}}

/* ---- buttons ---- */
div.stButton > button {{
  border-radius: 4px !important; border: 1px solid var(--line) !important;
  background: var(--panel-hi) !important; color: var(--text) !important;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem !important;
}}
div.stButton > button:hover {{ border-color: var(--ai) !important; color: var(--ai) !important; }}

[data-testid="stMetricValue"] {{ font-family: 'IBM Plex Mono', monospace; }}
</style>
"""


# ---------------------------------------------------------------------------
# RENDER HELPERS (return HTML strings — caller wraps in st.markdown(..., unsafe_allow_html=True))
# ---------------------------------------------------------------------------

def device_tile(dev_name: str, meta: dict, reading: dict, offline: bool) -> str:
    color = STATUS_COLOR.get(reading["status"], TOKENS["text_dim"])
    pulse = "pulse" if reading["status"] in ("CRITICAL", "DOWN") else ""
    val = reading["reading"]
    unit = reading["unit"]
    val_str = f"{val}{unit}" if val is not None else "—"
    offline_cls = "offline" if offline else ""
    label = dev_name.replace("_", " ")
    status_text = "OFFLINE" if offline else reading["status"]
    return f"""
<div class="tile {offline_cls}">
  <div class="tile-top">
    <span class="tile-glyph">{meta['glyph']}</span>
    <span class="led {pulse}" style="background:{color}; color:{color};"></span>
  </div>
  <div class="tile-name">{html.escape(label)}</div>
  <div class="tile-reading" style="color:{color}">{html.escape(val_str)}</div>
  <div class="tile-status" style="color:{color if not offline else TOKENS['text_dim']}">{status_text}</div>
</div>
"""


def severity_strip(label: str, severity: str) -> str:
    color = STATUS_COLOR.get(severity, TOKENS["warn"])
    return f"""
<div class="sev-strip" style="color:{color}; border-color:{color};">
  <span class="sev-dot" style="background:{color}; color:{color};"></span>
  {html.escape(severity)} — {html.escape(label)}
</div>
"""


def confidence_gauge(confidence: int, segments: int = 10) -> str:
    color = TOKENS["ok"] if confidence >= 80 else (TOKENS["warn"] if confidence >= 60 else TOKENS["crit"])
    filled = round((confidence / 100) * segments)
    segs = "".join(
        f'<div class="gauge-seg {"on" if i < filled else ""}" style="--seg-color:{color}"></div>'
        for i in range(segments)
    )
    return f"""
<div class="gauge-wrap">
  <div class="gauge">{segs}</div>
  <span class="gauge-pct" style="color:{color}">{confidence}%</span>
</div>
"""


def ai_block(text: str) -> str:
    return f"""
<div class="ai-block">
  <span class="ai-label">🤖 AI narration — grounded in the readings above, no invented facts</span>
  <div class="ai-text">{html.escape(text)}</div>
</div>
"""


def ai_unavailable_note(reason: str) -> str:
    return f'<div class="ai-unavailable">AI narration unavailable ({html.escape(reason)}) — showing rule-engine evidence only.</div>'


def risk_badge(risk: str) -> str:
    color = {"low": TOKENS["ok"], "medium": TOKENS["warn"], "high": TOKENS["crit"]}.get(risk, TOKENS["text_dim"])
    return f'<span class="badge" style="color:{color}">{risk.upper()} RISK</span>'


def audit_terminal(rows) -> str:
    if not rows:
        return '<div class="term"><span class="term-ts">— no events logged yet —</span></div>'
    color_for = {
        "FAULT_DETECTED": TOKENS["crit"],
        "DIAGNOSIS": TOKENS["ai"],
        "ACTION_APPROVED_EXECUTED": TOKENS["ok"],
        "ACTION_REJECTED": TOKENS["text_dim"],
    }
    body = ""
    for ts, ev, detail in rows:
        c = color_for.get(ev, TOKENS["text"])
        body += (
            f'<div class="term-row">'
            f'<span class="term-ts">{html.escape(ts)}</span>'
            f'<span style="color:{c}">{html.escape(ev)}</span>'
            f'<span class="term-detail">{html.escape(detail)}</span>'
            f'</div>'
        )
    return f'<div class="term">{body}</div>'
