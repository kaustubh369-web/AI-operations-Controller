"""
ai_engine.py — grounded AI narration layer for the Self-Healing AI
Operations Controller (SOAIDEATHON-S3).

WHY THIS FILE EXISTS
---------------------
The problem statement asks for a system that "identifies the likely root
cause" and "recommends safe recovery playbooks." Root-cause identification
and playbook ranking are exactly the kind of decisions that MUST stay
deterministic in a campus-infrastructure system — a hallucinated root cause
or an invented "fix" is not an acceptable failure mode. So `core.py` keeps
100% of that responsibility as a plain rule engine: no LLM call sits
anywhere near the decision of *what* the root cause is or *which* actions
are offered.

This module adds a strictly additive narration layer on top of that
decision. Claude is only ever given the already-computed structured facts
(root cause, confidence, current readings, the fixed action + its
deterministic sandbox prediction) and asked to restate them in plain
operator language — never to invent a new cause, number, or action. That's
the "no hallucination" design: the model has nothing to hallucinate *about*
because everything it's allowed to talk about is already fixed by core.py.

If ANTHROPIC_API_KEY isn't set, or the package isn't installed, or the call
fails for any reason (offline demo, no internet, rate limit), every
function here returns None and the UI falls back to the rule-engine's own
evidence text. The app's correctness never depends on this file succeeding.
"""

import os
import json
from typing import Optional

try:
    import anthropic
    _SDK_AVAILABLE = True
except ImportError:
    _SDK_AVAILABLE = False

# Haiku is used deliberately: this narration sits in the "sandbox preview"
# path of the UI, where the ask is fast, cheap, grounded explanation — not
# open-ended reasoning. Swap to "claude-sonnet-5" below if you want richer
# prose and don't mind the extra latency.
MODEL = "claude-haiku-4-5-20251001"

_GROUNDING_RULES = (
    "You are the narration layer inside a campus AIOps console. You will be "
    "given a JSON object of facts that were already computed by a "
    "deterministic rule engine. Restate them for a human operator in 2-3 "
    "plain sentences.\n"
    "Hard rules:\n"
    "- Never mention a device that is not a key in `known_topology_devices`.\n"
    "- Never state a confidence number, cause, or prediction other than the "
    "ones given to you.\n"
    "- Never propose a new action; only explain the one given.\n"
    "- If `degraded_mode` or missing data is present, say so plainly.\n"
    "- Output plain text only. No markdown, no headers, no preamble like "
    "'Here is a summary'."
)


def ai_available() -> bool:
    return _SDK_AVAILABLE and bool(os.environ.get("ANTHROPIC_API_KEY"))


def unavailable_reason() -> str:
    if not _SDK_AVAILABLE:
        return "the 'anthropic' package isn't installed"
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return "no ANTHROPIC_API_KEY is set"
    return "unknown"


def _client():
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _call(facts: dict, max_tokens: int = 220):
    try:
        resp = _client().messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=_GROUNDING_RULES,
            messages=[{"role": "user", "content": json.dumps(facts)}],
        )
        parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
        text = "".join(parts).strip()
        return text or None
    except Exception:
        # Network error, bad key, rate limit, etc. — fail silently and let
        # the caller fall back to the deterministic evidence text.
        return None


def explain_diagnosis(diagnosis: dict, readings: dict, known_devices: list) -> Optional[str]:
    """Grounded plain-language explanation of an already-computed diagnosis."""
    if not ai_available():
        return None
    facts = {
        "task": "explain_diagnosis",
        "root_cause_device": diagnosis["root_cause"],
        "confidence_pct": diagnosis["confidence"],
        "degraded_mode": diagnosis["degraded"],
        "rule_engine_evidence": diagnosis["evidence"],
        "current_readings": readings,
        "known_topology_devices": known_devices,
    }
    return _call(facts)


def explain_action(fault_label: str, action: dict, degraded: bool) -> Optional[str]:
    """Grounded plain-language explanation of one fixed, already-ranked action."""
    if not ai_available():
        return None
    facts = {
        "task": "explain_action",
        "incident": fault_label,
        "action": action["action"],
        "risk_tag": action["risk"],
        "deterministic_sandbox_prediction": action["predicted"],
        "degraded_mode": degraded,
    }
    return _call(facts, max_tokens=160)
