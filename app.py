"""
Self-Healing AI Operations Controller — Prototype Dashboard
SOAIDEATHON-S3

Run with:  streamlit run app.py
"""

import streamlit as st
import core
import style
import ai_engine

st.set_page_config(page_title="Self-Healing AI Ops Controller", layout="wide")
core.init_db()
st.markdown(style.inject_css(len(core.DEVICES)), unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# SESSION STATE INIT
# ---------------------------------------------------------------------------
if "devices" not in st.session_state:
    st.session_state.devices = core.default_state()
if "active_faults" not in st.session_state:
    st.session_state.active_faults = []          # list of fault_keys, in the order injected
if "diagnoses" not in st.session_state:
    st.session_state.diagnoses = {}               # fault_key -> diagnosis dict
if "disabled_sources" not in st.session_state:
    st.session_state.disabled_sources = set()
if "resolved_msgs" not in st.session_state:
    st.session_state.resolved_msgs = []


def _clear_ai_state(fault_key):
    """Drop any cached AI narration tied to a fault_key (new incident or resolved incident)."""
    st.session_state.pop(f"ai_diag_{fault_key}", None)
    for k in list(st.session_state.keys()):
        if k.startswith(f"ai_action_{fault_key}_"):
            del st.session_state[k]


AI_ON = ai_engine.ai_available()

# ---------------------------------------------------------------------------
# HEADER
# ---------------------------------------------------------------------------
callsign_cls = "" if AI_ON else "dim"
callsign_txt = "🤖 AI NARRATION — ONLINE" if AI_ON else "🤖 AI NARRATION — OFFLINE (rule engine only)"
st.markdown(
    f"""
<div class="ops-header">
  <div>
    <p class="ops-title">🛠️ Self-Healing AI Operations Controller</p>
    <p class="ops-sub">NODE: CAMPUS-01 &nbsp;·&nbsp; Digital &amp; Physical Infrastructure &nbsp;·&nbsp; SOAIDEATHON-S3 prototype</p>
  </div>
  <div class="ops-callsign {callsign_cls}">{callsign_txt}</div>
</div>
""",
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# SIDEBAR — control deck
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown('<div class="deck-eyebrow">STEP 01 — INJECT FAULT</div>', unsafe_allow_html=True)
    st.caption("You can inject several at once — each is diagnosed and resolved independently.")
    fault_options = {v["label"]: k for k, v in core.FAULT_LIBRARY.items()}
    chosen_label = st.selectbox("Choose a fault to simulate", list(fault_options.keys()), label_visibility="collapsed")
    if st.button("🔥 Inject Fault", use_container_width=True):
        fault_key = fault_options[chosen_label]
        core.FAULT_LIBRARY[fault_key]["apply"](st.session_state.devices)
        if fault_key not in st.session_state.active_faults:
            st.session_state.active_faults.append(fault_key)
        st.session_state.diagnoses.pop(fault_key, None)
        _clear_ai_state(fault_key)
        core.log_event("FAULT_DETECTED", f"{core.FAULT_LIBRARY[fault_key]['label']} detected.")
        st.rerun()

    if st.session_state.active_faults:
        st.caption(f"⬤ Active faults: {len(st.session_state.active_faults)}")

    st.markdown('<div class="deck-eyebrow">STEP 02 — DEGRADE SENSORS</div>', unsafe_allow_html=True)
    st.caption("Simulate a data source going offline — diagnosis should still run, just with lower confidence.")
    all_sources = core.DEVICES
    disabled = st.multiselect(
        "Mark these sensors/services as OFFLINE",
        all_sources,
        default=list(st.session_state.disabled_sources),
        label_visibility="collapsed",
    )
    st.session_state.disabled_sources = set(disabled)

    st.markdown('<div class="deck-eyebrow">STEP 03 — RESET</div>', unsafe_allow_html=True)
    if st.button("♻️ Reset Everything", use_container_width=True):
        st.session_state.devices = core.default_state()
        st.session_state.active_faults = []
        st.session_state.diagnoses = {}
        st.session_state.disabled_sources = set()
        st.session_state.resolved_msgs = []
        for k in list(st.session_state.keys()):
            if k.startswith("ai_diag_") or k.startswith("ai_action_"):
                del st.session_state[k]
        core.clear_audit_log()
        st.rerun()

    st.markdown('<div class="deck-eyebrow">AI NARRATION MODE</div>', unsafe_allow_html=True)
    if AI_ON:
        st.caption(
            f"Model: `{ai_engine.MODEL}`. Diagnosis and root cause always come from the "
            f"rule engine — AI narration is opt-in per incident (button), never automatic, "
            f"so the demo stays fast and deterministic."
        )
    else:
        st.caption(
            f"Rule engine is fully operational without it. To enable AI narration, set the "
            f"`ANTHROPIC_API_KEY` environment variable before launching "
            f"({ai_engine.unavailable_reason()})."
        )

# ---------------------------------------------------------------------------
# TOP ROW — live device status
# ---------------------------------------------------------------------------
st.subheader("📡 Live Campus Infrastructure Status")
readings = core.snapshot_readings(st.session_state.devices)
tiles_html = '<div class="tile-grid">'
for dev in core.DEVICES:
    meta = core.DEVICE_META[dev]
    offline = dev in st.session_state.disabled_sources
    tiles_html += style.device_tile(dev, meta, readings[dev], offline)
tiles_html += "</div>"
st.markdown(tiles_html, unsafe_allow_html=True)

st.divider()

for msg in st.session_state.resolved_msgs:
    st.success(msg)
if st.session_state.resolved_msgs:
    st.session_state.resolved_msgs = []  # show once, then clear

# ---------------------------------------------------------------------------
# ONE CARD PER ACTIVE FAULT — each diagnosed and resolved independently
# ---------------------------------------------------------------------------
if not st.session_state.active_faults:
    st.info("No active faults. Inject one (or several) from the control deck to see the AI diagnose them.")
else:
    st.subheader(f"🚨 Active Incidents ({len(st.session_state.active_faults)})")

    for fault_key in list(st.session_state.active_faults):
        fault_meta = core.FAULT_LIBRARY[fault_key]
        root_dev = fault_meta["root_cause"]
        root_status = st.session_state.devices[root_dev]["status"]
        st.markdown(style.severity_strip(fault_meta["label"], root_status), unsafe_allow_html=True)

        with st.container(border=True):
            left, right = st.columns([1, 1])

            with left:
                st.markdown("**🧠 AI Diagnosis**")
                if st.button("Run Root-Cause Correlation", key=f"diag_{fault_key}"):
                    diag = core.correlate(
                        st.session_state.devices,
                        fault_key,
                        st.session_state.disabled_sources,
                    )
                    st.session_state.diagnoses[fault_key] = diag
                    core.log_event(
                        "DIAGNOSIS",
                        f"[{fault_meta['label']}] Root cause: {diag['root_cause']} | "
                        f"Confidence: {diag['confidence']}% "
                        f"{'(DEGRADED - missing data)' if diag['degraded'] else ''}",
                    )
                    st.rerun()

                diag = st.session_state.diagnoses.get(fault_key)
                if diag:
                    st.markdown(f"**Likely Root Cause:** `{diag['root_cause']}`")
                    st.markdown(style.confidence_gauge(diag["confidence"]), unsafe_allow_html=True)
                    if diag["degraded"]:
                        st.warning(
                            "⚠️ Operating in degraded mode — some sensor data is unavailable. "
                            "Diagnosis confidence lowered accordingly."
                        )
                    st.markdown("**Rule-engine evidence:**")
                    st.caption(diag["evidence"])

                    ai_key = f"ai_diag_{fault_key}"
                    if AI_ON:
                        if st.button("🤖 Ask AI to explain this diagnosis", key=f"aibtn_{fault_key}"):
                            text = ai_engine.explain_diagnosis(diag, readings, core.DEVICES)
                            st.session_state[ai_key] = text if text else "__failed__"
                            st.rerun()
                        if ai_key in st.session_state:
                            val = st.session_state[ai_key]
                            if val != "__failed__":
                                st.markdown(style.ai_block(val), unsafe_allow_html=True)
                            else:
                                st.markdown(style.ai_unavailable_note("the API call failed"), unsafe_allow_html=True)
                    else:
                        st.markdown(style.ai_unavailable_note(ai_engine.unavailable_reason()), unsafe_allow_html=True)

            with right:
                st.markdown("**🧪 Recommended Playbook & Sandbox Preview**")
                diag = st.session_state.diagnoses.get(fault_key)
                if diag is None:
                    st.info("Run a diagnosis first to see recommended fixes.")
                else:
                    playbook = core.recommend(diag["fault_key"])

                    for i, action in enumerate(playbook):
                        with st.container(border=True):
                            st.markdown(f"**Option {i + 1}: {action['action']}**")
                            st.markdown(style.risk_badge(action["risk"]), unsafe_allow_html=True)
                            st.caption(f"🧪 Sandbox prediction: {core.sandbox_preview(action)}")

                            if AI_ON:
                                akey = f"ai_action_{fault_key}_{i}"
                                if st.button("🤖 AI rationale", key=f"aiactbtn_{fault_key}_{i}"):
                                    text = ai_engine.explain_action(fault_meta["label"], action, diag["degraded"])
                                    st.session_state[akey] = text if text else "__failed__"
                                    st.rerun()
                                if akey in st.session_state:
                                    val = st.session_state[akey]
                                    if val != "__failed__":
                                        st.markdown(style.ai_block(val), unsafe_allow_html=True)
                                    else:
                                        st.markdown(style.ai_unavailable_note("the API call failed"), unsafe_allow_html=True)

                            c1, c2 = st.columns(2)
                            with c1:
                                if st.button("✅ Approve & Execute", key=f"approve_{fault_key}_{i}"):
                                    core.execute_action(
                                        st.session_state.devices, fault_key, action,
                                        other_active_faults=st.session_state.active_faults,
                                    )
                                    core.log_event(
                                        "ACTION_APPROVED_EXECUTED",
                                        f"[{fault_meta['label']}] Action '{action['action']}' approved "
                                        f"by human operator and executed. Predicted: {action['predicted']}",
                                    )
                                    st.session_state.active_faults.remove(fault_key)
                                    st.session_state.diagnoses.pop(fault_key, None)
                                    _clear_ai_state(fault_key)
                                    st.session_state.resolved_msgs.append(
                                        f"✅ [{fault_meta['label']}] '{action['action']}' executed. System restored."
                                    )
                                    st.rerun()
                            with c2:
                                if st.button("❌ Reject", key=f"reject_{fault_key}_{i}"):
                                    core.log_event(
                                        "ACTION_REJECTED",
                                        f"[{fault_meta['label']}] Action '{action['action']}' "
                                        f"rejected by human operator.",
                                    )
                                    st.toast("Action rejected and logged.")

st.divider()

# ---------------------------------------------------------------------------
# BOTTOM — audit trail
# ---------------------------------------------------------------------------
st.subheader("📜 Audit Trail")
st.caption("Immutable, timestamped log of every detection, diagnosis, approval, and rejection.")
rows = core.get_audit_log()
st.markdown(style.audit_terminal(rows), unsafe_allow_html=True)
