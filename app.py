"""
Self-Healing AI Operations Controller — Prototype Dashboard
SOAIDEATHON-S3

Run with:  streamlit run app.py
"""

import streamlit as st
import core

st.set_page_config(page_title="Self-Healing AI Ops Controller", layout="wide")
core.init_db()

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

st.title("🛠️ Self-Healing AI Operations Controller")
st.caption("Prototype — Campus Digital & Physical Infrastructure  |  SOAIDEATHON-S3")

# ---------------------------------------------------------------------------
# SIDEBAR — controls
# ---------------------------------------------------------------------------
with st.sidebar:
    st.header("Controls")

    st.subheader("1. Inject Faults")
    st.caption("You can inject several at once — each is diagnosed and resolved independently.")
    fault_options = {v["label"]: k for k, v in core.FAULT_LIBRARY.items()}
    chosen_label = st.selectbox("Choose a fault to simulate", list(fault_options.keys()))
    if st.button("🔥 Inject Fault", use_container_width=True):
        fault_key = fault_options[chosen_label]
        core.FAULT_LIBRARY[fault_key]["apply"](st.session_state.devices)
        if fault_key not in st.session_state.active_faults:
            st.session_state.active_faults.append(fault_key)
        st.session_state.diagnoses.pop(fault_key, None)
        core.log_event("FAULT_DETECTED", f"{core.FAULT_LIBRARY[fault_key]['label']} detected.")
        st.rerun()

    if st.session_state.active_faults:
        st.caption(f"Active faults: {len(st.session_state.active_faults)}")

    st.divider()
    st.subheader("2. Graceful Degradation")
    st.caption("Simulate a data source going offline — diagnosis should still run, "
               "just with lower confidence.")
    all_sources = core.DEVICES
    disabled = st.multiselect("Mark these sensors/services as OFFLINE",
                               all_sources,
                               default=list(st.session_state.disabled_sources))
    st.session_state.disabled_sources = set(disabled)

    st.divider()
    if st.button("♻️ Reset Everything", use_container_width=True):
        st.session_state.devices = core.default_state()
        st.session_state.active_faults = []
        st.session_state.diagnoses = {}
        st.session_state.disabled_sources = set()
        st.session_state.resolved_msgs = []
        core.clear_audit_log()
        st.rerun()

# ---------------------------------------------------------------------------
# TOP ROW — live device status
# ---------------------------------------------------------------------------
st.subheader("📡 Live Campus Infrastructure Status")
cols = st.columns(len(core.DEVICES))
status_icon = {"OK": "🟢", "DEGRADED": "🟠", "CRITICAL": "🔴", "DOWN": "🔴"}

for col, dev in zip(cols, core.DEVICES):
    d = st.session_state.devices[dev]
    offline_tag = " (OFFLINE — no data)" if dev in st.session_state.disabled_sources else ""
    with col:
        st.metric(
            label=f"{status_icon.get(d['status'], '⚪')} {dev.replace('_', ' ').title()}",
            value=d["status"] + offline_tag,
        )

st.divider()

for msg in st.session_state.resolved_msgs:
    st.success(msg)
if st.session_state.resolved_msgs:
    st.session_state.resolved_msgs = []  # show once, then clear

# ---------------------------------------------------------------------------
# ONE CARD PER ACTIVE FAULT — each diagnosed and resolved independently
# ---------------------------------------------------------------------------
if not st.session_state.active_faults:
    st.info("No active faults. Inject one (or several) from the sidebar to see the AI diagnose them.")
else:
    st.subheader(f"🚨 Active Incidents ({len(st.session_state.active_faults)})")

    for fault_key in list(st.session_state.active_faults):
        fault_meta = core.FAULT_LIBRARY[fault_key]
        with st.container(border=True):
            st.markdown(f"### {fault_meta['label']}")
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
                    conf_color = "🟢" if diag["confidence"] >= 80 else ("🟠" if diag["confidence"] >= 60 else "🔴")
                    st.markdown(f"**Likely Root Cause:** `{diag['root_cause']}`")
                    st.markdown(f"**Confidence:** {conf_color} {diag['confidence']}%")
                    if diag["degraded"]:
                        st.warning("⚠️ Operating in degraded mode — some sensor data is unavailable. "
                                   "Diagnosis confidence lowered accordingly.")
                    st.markdown("**Evidence:**")
                    st.write(diag["evidence"])

            with right:
                st.markdown("**🧪 Recommended Playbook & Sandbox Preview**")
                diag = st.session_state.diagnoses.get(fault_key)
                if diag is None:
                    st.info("Run a diagnosis first to see recommended fixes.")
                else:
                    playbook = core.recommend(diag["fault_key"])
                    risk_color = {"low": "🟢", "medium": "🟠", "high": "🔴"}

                    for i, action in enumerate(playbook):
                        with st.container(border=True):
                            st.markdown(f"**Option {i+1}: {action['action']}**  "
                                        f"{risk_color[action['risk']]} `{action['risk'].upper()} risk`")
                            st.caption(f"🧪 Sandbox prediction: {core.sandbox_preview(action)}")

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
if rows:
    st.table(
        [{"Timestamp": r[0], "Event": r[1], "Detail": r[2]} for r in rows]
    )
else:
    st.caption("No events logged yet.")
