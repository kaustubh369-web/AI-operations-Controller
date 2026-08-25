"""
Core simulation + correlation + recommendation + sandbox + audit logic
for the Self-Healing AI Operations Controller prototype (SOAIDEATHON-S3).

This module is UI-agnostic. app.py (Streamlit) imports and drives it.
"""

import random
import sqlite3
import time
from datetime import datetime

DB_PATH = "audit_trail.db"

# ---------------------------------------------------------------------------
# 1. CAMPUS TOPOLOGY (simulated devices + their dependencies)
# ---------------------------------------------------------------------------

DEVICES = ["power_grid", "wifi_router", "database", "web_server", "hvac_sensor", "door_sensor"]

# what each device depends on (its upstream causes)
DEPENDENCIES = {
    "web_server": ["database", "wifi_router"],
    "database": ["power_grid"],
    "wifi_router": ["power_grid"],
    "hvac_sensor": ["power_grid"],
    "door_sensor": ["power_grid"],
    "power_grid": [],
}

# Display metadata for each device: which raw field is its headline reading,
# what to call it, its unit, and a glyph for the control-room tile UI.
# Purely cosmetic / presentational — never consulted by the correlation logic.
DEVICE_META = {
    "power_grid":  {"glyph": "⚡", "metric_key": "voltage",    "metric_label": "Voltage",     "unit": "V",  "kind": "physical"},
    "wifi_router": {"glyph": "📡", "metric_key": "latency_ms", "metric_label": "Latency",     "unit": "ms", "kind": "digital"},
    "database":    {"glyph": "🗄", "metric_key": "query_ms",   "metric_label": "Query time",  "unit": "ms", "kind": "digital"},
    "web_server":  {"glyph": "🖥",  "metric_key": "cpu_pct",    "metric_label": "CPU load",    "unit": "%",  "kind": "digital"},
    "hvac_sensor": {"glyph": "🌡", "metric_key": "temp_c",     "metric_label": "Temperature", "unit": "°C", "kind": "physical"},
    "door_sensor": {"glyph": "🚪", "metric_key": "open_count", "metric_label": "Open events", "unit": "",   "kind": "physical"},
}


def snapshot_readings(state):
    """
    Flat, JSON-safe snapshot of every device's headline reading + status.
    Used for (a) rendering the control-room tiles and (b) as the ONLY
    telemetry payload ever handed to the AI narration layer, so the model
    can't reach for data it wasn't given.
    """
    snap = {}
    for dev, meta in DEVICE_META.items():
        d = state[dev]
        snap[dev] = {
            "status": d["status"],
            "reading": d.get(meta["metric_key"]),
            "unit": meta["unit"],
            "online": d.get("online", True),
        }
    return snap

def default_state():
    """Fresh healthy state for all devices."""
    return {
        "power_grid":  {"status": "OK", "voltage": 230, "online": True},
        "wifi_router": {"status": "OK", "latency_ms": 12, "online": True},
        "database":    {"status": "OK", "query_ms": 8, "online": True},
        "web_server":  {"status": "OK", "cpu_pct": 22, "online": True},
        "hvac_sensor": {"status": "OK", "temp_c": 24, "online": True},
        "door_sensor": {"status": "OK", "open_count": 3, "online": True},
    }

# ---------------------------------------------------------------------------
# 2. FAULT LIBRARY  (fault_type -> root cause, symptoms, playbook, risk)
# ---------------------------------------------------------------------------

FAULT_LIBRARY = {
    "power_fluctuation": {
        "label": "Power Grid Fluctuation",
        "root_cause": "power_grid",
        "apply": lambda s: s["power_grid"].update({"status": "DEGRADED", "voltage": 190}),
        "symptom_devices": ["power_grid", "database", "wifi_router", "hvac_sensor"],
        "evidence": "Voltage dropped from 230V to 190V; downstream devices (database, "
                    "router, HVAC) reporting instability within same 30s window.",
        "playbook": [
            {"action": "Switch to backup UPS supply", "risk": "low",
             "predicted": "Estimated 2s switchover, zero downtime for connected services."},
            {"action": "Restart affected downstream services (database, router)", "risk": "medium",
             "predicted": "~20s downtime for web_server; ~150 active sessions briefly interrupted."},
        ],
    },
    "db_overload": {
        "label": "Database Overload",
        "root_cause": "database",
        "apply": lambda s: s["database"].update({"status": "CRITICAL", "query_ms": 4200}),
        "symptom_devices": ["database", "web_server"],
        "evidence": "Query latency spiked from 8ms to 4200ms; web_server error rate rising "
                    "in the same window, matching known dependency (web_server -> database).",
        "playbook": [
            {"action": "Clear query cache and kill long-running queries", "risk": "low",
             "predicted": "Expected recovery in ~10s, no user-facing downtime."},
            {"action": "Restart database service", "risk": "high",
             "predicted": "~45s full outage for web_server; all active sessions dropped."},
        ],
    },
    "wifi_outage": {
        "label": "WiFi Router Outage",
        "root_cause": "wifi_router",
        "apply": lambda s: s["wifi_router"].update({"status": "DOWN", "latency_ms": 9999, "online": False}),
        "symptom_devices": ["wifi_router", "web_server"],
        "evidence": "Router latency reads timeout (9999ms) and link marked offline; "
                    "web_server reachability from campus WiFi failing correspondingly.",
        "playbook": [
            {"action": "Reroute traffic through secondary access point", "risk": "low",
             "predicted": "~5s reroute time, minimal disruption for ~40 connected users."},
            {"action": "Power-cycle primary router", "risk": "medium",
             "predicted": "~60s full WiFi blackout for the building during reboot."},
        ],
    },
    "hvac_failure": {
        "label": "HVAC Sensor Failure / Overheat",
        "root_cause": "hvac_sensor",
        "apply": lambda s: s["hvac_sensor"].update({"status": "CRITICAL", "temp_c": 41}),
        "symptom_devices": ["hvac_sensor"],
        "evidence": "Server-room temperature reading climbed to 41°C, well above the 30°C "
                    "safe threshold, with no corresponding power or network anomaly.",
        "playbook": [
            {"action": "Trigger auxiliary cooling unit", "risk": "low",
             "predicted": "Temperature expected to normalize within ~4 minutes."},
            {"action": "Alert facilities team for manual inspection", "risk": "low",
             "predicted": "No system downtime; human dispatched to server room."},
        ],
    },
}

# ---------------------------------------------------------------------------
# 3. CORRELATION ENGINE
# ---------------------------------------------------------------------------

def correlate(state, active_fault, disabled_sources):
    """
    Rule-based root-cause correlation.
    disabled_sources: set of device names whose data is currently 'unavailable'
    (used for the graceful-degradation demo).
    Returns dict: root_cause, confidence, evidence, fault_key
    """
    if active_fault is None:
        return None

    fault = FAULT_LIBRARY[active_fault]
    symptom_devices = fault["symptom_devices"]

    # confidence starts high, drops for every symptom device whose data source is disabled
    missing = [d for d in symptom_devices if d in disabled_sources]
    base_confidence = 96
    penalty_per_missing = 22
    confidence = max(base_confidence - penalty_per_missing * len(missing), 35)

    evidence = fault["evidence"]
    if missing:
        evidence += f" NOTE: data from {', '.join(missing)} is currently unavailable — " \
                    f"diagnosis based on partial evidence."

    return {
        "fault_key": active_fault,
        "root_cause": fault["root_cause"],
        "label": fault["label"],
        "confidence": confidence,
        "evidence": evidence,
        "degraded": bool(missing),
    }


def recommend(fault_key):
    """Return the ranked playbook (already risk-tagged) for a fault."""
    return FAULT_LIBRARY[fault_key]["playbook"]


def sandbox_preview(action):
    """'Dry run' — just returns the precomputed predicted outcome for the action."""
    return action["predicted"]


def execute_action(state, fault_key, action, other_active_faults=None):
    """
    Simulate actually applying the fix: restore the affected device(s) to OK.
    other_active_faults: fault_keys still unresolved elsewhere — their symptom
    devices are left untouched so resolving one incident never masks another.
    """
    other_active_faults = other_active_faults or []
    # only an unresolved fault's own ROOT CAUSE device is off-limits — a device
    # merely listed as a symptom elsewhere doesn't block this fix from healing it.
    protected = {
        FAULT_LIBRARY[other_key]["root_cause"]
        for other_key in other_active_faults
        if other_key != fault_key
    }

    fault = FAULT_LIBRARY[fault_key]
    healthy = default_state()
    devices_to_heal = [fault["root_cause"]] + fault["symptom_devices"]
    for d in devices_to_heal:
        if d == fault["root_cause"] or d not in protected:
            state[d].update(healthy[d])
    return state


# ---------------------------------------------------------------------------
# 4. AUDIT TRAIL (persisted to SQLite so it survives across the recording)
# ---------------------------------------------------------------------------

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            event_type TEXT,
            detail TEXT
        )
    """)
    conn.commit()
    conn.close()


def log_event(event_type, detail):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO audit_log (timestamp, event_type, detail) VALUES (?, ?, ?)",
        (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), event_type, detail),
    )
    conn.commit()
    conn.close()


def get_audit_log(limit=50):
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT timestamp, event_type, detail FROM audit_log ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return rows


def clear_audit_log():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM audit_log")
    conn.commit()
    conn.close()
