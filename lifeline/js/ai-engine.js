// ============================================================================
// LifeLine by Cognora — AI Ops Engine
// ----------------------------------------------------------------------------
// This module simulates the "correlate telemetry -> sandbox candidate fixes ->
// rank by risk -> recommend a playbook" pipeline described in the problem
// statement, without needing a live LLM/API key — important for a reliable
// live demo. It is deliberately isolated behind one function per stage
// (analyzeReport, runSandboxSimulation) so a real model call can be dropped
// in later (see "SWAP IN A REAL LLM" note near the bottom).
// ============================================================================

// Keyword -> weight tables per category. Higher weight = more severe signal.
const SEVERITY_KEYWORDS = {
  electrical: [
    ["spark", 9], ["sparks", 9], ["shock", 10], ["smoke", 10], ["burning smell", 10],
    ["exposed wire", 8], ["short circuit", 8], ["fire", 10], ["tripped", 4], ["flicker", 2],
    ["no power", 5], ["socket", 2], ["switch", 1],
  ],
  plumbing: [
    ["flood", 8], ["flooding", 8], ["burst pipe", 9], ["gas smell", 10], ["overflow", 6],
    ["leak", 4], ["leaking", 4], ["no water", 5], ["clogged", 2], ["drip", 1],
  ],
  network: [
    ["down", 5], ["outage", 6], ["no internet", 4], ["router", 2], ["slow", 1], ["disconnect", 3],
  ],
  fire_safety: [
    ["fire", 10], ["smoke", 10], ["alarm", 7], ["extinguisher missing", 8], ["blocked exit", 9], ["gas leak", 10],
  ],
  structural: [
    ["crack", 6], ["collapse", 10], ["ceiling falling", 9], ["falling", 8], ["unstable", 7], ["broken railing", 6], ["door stuck", 3],
  ],
  sanitation: [
    ["overflow", 6], ["sewage", 8], ["infestation", 7], ["mold", 5], ["garbage", 2], ["smell", 3],
  ],
  security: [
    ["intruder", 10], ["broken lock", 6], ["theft", 7], ["unauthorized", 6], ["door open", 4], ["camera down", 4],
  ],
  other: [["urgent", 5], ["emergency", 8], ["dangerous", 7]],
};

const GLOBAL_URGENCY_KEYWORDS = [
  ["injured", 10], ["injury", 10], ["hurt", 8], ["can't breathe", 10], ["trapped", 10],
  ["immediately", 3], ["right now", 3], ["everyone", 2], ["entire floor", 4], ["entire hostel", 5],
];

const PLAYBOOKS = {
  electrical: {
    low: "Log ticket for electrician's next scheduled round. No isolation needed; monitor for recurrence over 48 hours.",
    medium: "Isolate the affected circuit at the room/floor distribution board and dispatch an electrician within 4 hours. Advise occupants to avoid the fixture until cleared.",
    high: "Immediately cut mains power to the affected room/floor from the distribution board, evacuate the area if smoke/sparking was reported, and escalate to the on-call electrician and fire safety officer before any student re-enters.",
  },
  plumbing: {
    low: "Schedule a plumber visit within 2 working days; place a bucket/tray if dripping to prevent floor damage.",
    medium: "Shut the local supply valve for the affected room, dispatch a plumber same-day, and check adjoining rooms/floors below for water ingress.",
    high: "Shut the main water supply line for the wing immediately, evacuate rooms directly below if flooding is active, and treat any reported gas smell as a Fire/Safety co-incident requiring simultaneous gas-line shutoff.",
  },
  network: {
    low: "Restart the nearest access point remotely; if unresolved, log for the next maintenance window.",
    medium: "Dispatch IT support to inspect the floor switch/access point; notify affected rooms of expected downtime.",
    high: "Escalate to network admin — potential building-wide outage; verify core switch and ISP uplink status, activate backup link if configured.",
  },
  fire_safety: {
    low: "Log for routine fire-safety inspection; confirm nearest extinguisher and alarm are functional.",
    medium: "Send facilities to inspect the reported hazard within the hour; keep the area cordoned until cleared.",
    high: "Trigger evacuation protocol for the affected floor/wing immediately, alert the fire safety officer and local fire services, and do not allow re-entry until an all-clear is issued.",
  },
  structural: {
    low: "Log for the next facilities inspection round; advise light-touch use of the affected fixture (e.g. railing, door).",
    medium: "Cordon off the immediate area, dispatch facilities/civil maintenance within the day, restrict access until assessed.",
    high: "Evacuate the affected room and rooms directly above/below, cordon the area, and escalate to a structural engineer before permitting any re-entry.",
  },
  sanitation: {
    low: "Add to the next housekeeping round; no immediate health risk identified.",
    medium: "Dispatch housekeeping same-day and flag for pest control if infestation-related.",
    high: "Treat as an active health hazard — dispatch housekeeping and pest control immediately, restrict access to the affected common area until sanitized.",
  },
  security: {
    low: "Log the report and include in the next security patrol briefing.",
    medium: "Notify hostel security to inspect the lock/entry point within the hour and issue a temporary fix (e.g. padlock) if needed.",
    high: "Alert hostel security and warden immediately, treat as an active security incident, and review nearest camera footage before any further action.",
  },
  other: {
    low: "Log for warden review during regular office hours.",
    medium: "Flag for same-day warden review; gather more detail from the student if needed.",
    high: "Escalate to the warden on-call immediately for manual triage.",
  },
};

const CAUSE_TEMPLATES = {
  electrical: "wiring degradation, an overloaded circuit, or a faulty fixture in the reported location",
  plumbing: "pipe wear, a joint failure, or blockage causing pressure buildup in the reported location",
  network: "an access point or switch fault, or an upstream ISP/core network disruption",
  fire_safety: "a fire-safety hazard requiring physical inspection to confirm ignition source or blockage",
  structural: "material fatigue, water damage, or an installation fault in the reported fixture",
  sanitation: "irregular waste clearance, drainage blockage, or a pest entry point near the reported location",
  security: "a mechanical lock/entry-point fault or unauthorized access attempt",
  other: "an issue outside the standard telemetry categories, requiring manual classification",
};

/**
 * Score a report's text against keyword tables to estimate severity (0-10+).
 */
function scoreSeverity(category, description) {
  const text = (description || "").toLowerCase();
  let score = 2; // baseline signal — something was reported at all
  const matched = [];

  const catTable = SEVERITY_KEYWORDS[category] || SEVERITY_KEYWORDS.other;
  for (const [kw, weight] of catTable) {
    if (text.includes(kw)) { score += weight; matched.push(kw); }
  }
  for (const [kw, weight] of GLOBAL_URGENCY_KEYWORDS) {
    if (text.includes(kw)) { score += weight; matched.push(kw); }
  }
  return { score, matched };
}

function severityToRisk(score) {
  if (score >= 14) return "high";
  if (score >= 7) return "medium";
  return "low";
}

/**
 * Core "AI" analysis step — deterministic, explainable, no external calls.
 * Returns { riskLevel, reasoning, solution, matchedSignals }.
 */
function analyzeReport({ category, description, location }) {
  const { score, matched } = scoreSeverity(category, description);
  const riskLevel = severityToRisk(score);
  const playbook = (PLAYBOOKS[category] || PLAYBOOKS.other)[riskLevel];
  const cause = CAUSE_TEMPLATES[category] || CAUSE_TEMPLATES.other;

  const signalText = matched.length
    ? `Correlated signal terms detected in the report: ${[...new Set(matched)].slice(0, 5).join(", ")}.`
    : "No high-severity signal terms detected in the report text.";

  const reasoning =
    `Category "${formatCategory(category)}" reported at ${location || "an unspecified location"}. ` +
    `${signalText} Composite severity score: ${score}/30+ (thresholds: low < 7, medium 7-13, high ≥ 14). ` +
    `Likely root cause: ${cause}. This estimate is generated locally from report text and category — ` +
    `a warden should confirm before acting on high-risk recommendations.`;

  return { riskLevel, reasoning, solution: playbook, score, matchedSignals: matched };
}

function formatCategory(id) {
  // CATEGORIES is declared in js/supabase-client.js, loaded before this file.
  const found = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find((c) => c.id === id);
  return found ? found.label : id;
}

/**
 * Simulated sandbox pipeline — an ordered list of steps with timestamps and
 * severities, used to animate the "sandbox console" UI and to persist a
 * durable sandbox_log / audit_trail on the report row. This never touches
 * real infrastructure — it is a UI + reasoning simulation, matching the
 * "simulate or sandbox changes before execution" requirement.
 */
function buildSandboxSteps({ category, description, location }, analysis) {
  const cat = formatCategory(category);
  const steps = [
    { text: `Ingesting report metadata (category: ${cat}, location: ${location || "n/a"})`, level: "ok" },
    { text: "Correlating with network logs, application telemetry, and facility alarm feed…", level: "ok" },
    { text: "Cross-checking IoT sensor availability for the reported zone…", level: analysis.riskLevel === "high" ? "warn" : "ok" },
    { text: analysis.matchedSignals.length
        ? `Signal match: ${[...new Set(analysis.matchedSignals)].slice(0, 4).join(", ")}`
        : "No elevated signal terms found in report text", level: analysis.matchedSignals.length ? "warn" : "ok" },
    { text: `Running candidate recovery playbook in sandbox (no live systems affected)…`, level: "ok" },
    { text: `Simulated outcome: playbook resolves ${analysis.riskLevel === "high" ? "the immediate hazard, pending human confirmation" : "the reported issue with standard remediation"}.`,
      level: analysis.riskLevel === "high" ? "warn" : "ok" },
    { text: `Computing composite risk score → ${analysis.score}/30+`, level: "ok" },
    { text: `Risk classified as ${analysis.riskLevel.toUpperCase()}.`, level: analysis.riskLevel === "high" ? "crit" : analysis.riskLevel === "medium" ? "warn" : "ok" },
    { text: analysis.riskLevel === "high"
        ? "High-impact action — routing to warden/staff dashboard for MANDATORY human approval before execution."
        : "Routing recommendation to warden/staff dashboard for review and approval.", level: "ok" },
  ];
  return steps;
}

// ----------------------------------------------------------------------------
// SWAP IN A REAL LLM (optional, post-hackathon)
// ----------------------------------------------------------------------------
// Replace the body of `analyzeReport` with a call to a Supabase Edge Function
// that forwards { category, description, location } to an LLM API and parses
// a JSON { riskLevel, reasoning, solution } response. Keep the same return
// shape so the rest of the app (report.js, admin.js) needs no changes.
// ============================================================================
