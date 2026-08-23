// Lifeline — S3 Self-Healing AIOps Platform
// React component definitions. Loaded via Babel standalone in index.html,
// so no import/export statements are used — everything hangs off the
// global `React` object and the finished App is exposed as window.LifelineApp
// for app.js to mount.

const { useState, Fragment } = React;

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "incidents", label: "Incidents" },
  { id: "rootcause", label: "Root Cause Analysis" },
  { id: "telemetry", label: "Telemetry" },
  { id: "recovery", label: "Recovery" },
  { id: "sandbox", label: "Sandbox" },
  { id: "approvals", label: "Approvals" },
  { id: "audit", label: "Audit Trail" },
];

const BASE_TIME = new Date();
BASE_TIME.setHours(18, 32, 4, 0);

function fmtTime(offsetSeconds) {
  const t = new Date(BASE_TIME.getTime() + offsetSeconds * 1000);
  return t.toLocaleTimeString("en-GB", { hour12: false });
}

function Pulse({ w = 40, h = 16, stroke = "var(--coral)", strokeWidth = 2.5, animate = true }) {
  return (
    <svg width={w} height={h} viewBox="0 0 120 40" fill="none" className={animate ? "pulse-svg" : ""}>
      <path
        d="M0 20 H30 L38 6 L48 34 L56 20 H70 L76 12 L84 28 L90 20 H120"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StatusDot({ status }) {
  const map = {
    healthy: "var(--green)",
    warning: "var(--amber)",
    critical: "var(--coral)",
    unavailable: "var(--gray)",
  };
  return <span className="status-dot" style={{ background: map[status] }} />;
}

function StatusPill({ status }) {
  const labelMap = { healthy: "Healthy", warning: "Warning", critical: "Critical", unavailable: "Unavailable" };
  const classMap = { healthy: "pill-healthy", warning: "pill-warning", critical: "pill-critical", unavailable: "pill-unavailable" };
  return (
    <span className={`status-pill ${classMap[status]}`}>
      <StatusDot status={status} />
      {labelMap[status]}
    </span>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionEyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

/* ------------------------------ App ------------------------------ */

function App() {
  const [page, setPage] = useState("dashboard");
  const [stage, setStage] = useState(0); // 0 detected .. 6 resolved
  const [sensorDown, setSensorDown] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [execRunning, setExecRunning] = useState(false);
  const [execStep, setExecStep] = useState(0);
  const [approvalResult, setApprovalResult] = useState(null); // 'approved' | 'rejected' | null

  const confidence = sensorDown ? 74 : 89;

  const goto = (p) => {
    setPage(p);
  };

  const investigate = () => {
    setPage("rootcause");
    if (stage < 1) {
      setTimeout(() => setStage((s) => Math.max(s, 1)), 900);
    }
  };

  const runSimulation = () => {
    setSimRunning(true);
    setSimDone(false);
    setTimeout(() => {
      setSimRunning(false);
      setSimDone(true);
      setStage((s) => Math.max(s, 3));
    }, 1800);
  };

  const runExecution = () => {
    setExecRunning(true);
    setExecStep(0);
    let i = 0;
    const total = 6;
    const iv = setInterval(() => {
      i += 1;
      setExecStep(i);
      if (i >= total) {
        clearInterval(iv);
        setExecRunning(false);
        setStage(6);
      }
    }, 550);
  };

  const approve = () => {
    setApprovalResult("approved");
    setStage((s) => Math.max(s, 5));
    setPage("execution");
    setTimeout(runExecution, 400);
  };

  const reject = () => {
    setApprovalResult("rejected");
  };

  return (
    <div className="app-root">
      <Sidebar page={page} goto={goto} />
      <div className="main-col">
        <TopBar stage={stage} />
        <div className="page-scroll">
          {page === "dashboard" && <Dashboard stage={stage} onInvestigate={investigate} goto={goto} />}
          {page === "incidents" && <IncidentsList onInvestigate={investigate} stage={stage} />}
          {page === "rootcause" && (
            <RootCause
              stage={stage}
              sensorDown={sensorDown}
              setSensorDown={setSensorDown}
              confidence={confidence}
              goto={goto}
            />
          )}
          {page === "telemetry" && <Telemetry sensorDown={sensorDown} setSensorDown={setSensorDown} />}
          {page === "recovery" && <Recovery goto={goto} setStage={setStage} />}
          {page === "sandbox" && (
            <Sandbox
              simRunning={simRunning}
              simDone={simDone}
              runSimulation={runSimulation}
              goto={goto}
            />
          )}
          {page === "approvals" && (
            <Approvals approvalResult={approvalResult} approve={approve} reject={reject} confidence={confidence} />
          )}
          {page === "execution" && (
            <Execution execStep={execStep} execRunning={execRunning} stage={stage} goto={goto} />
          )}
          {page === "audit" && <AuditTrail stage={stage} sensorDown={sensorDown} approvalResult={approvalResult} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Sidebar ------------------------------ */

function Sidebar({ page, goto }) {
  return (
    <aside className="sidebar">
      <div className="brand-mark">
        <Pulse w={34} h={14} stroke="var(--coral)" />
        <span className="brand-name">Lifeline</span>
      </div>
      <div className="sidebar-sub">AIOps Recovery Platform</div>
      <nav className="nav-list">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "nav-item-active" : ""}`}
            onClick={() => goto(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="footer-principle">
          <strong>AI recommends.</strong>
          <br />
          Humans govern high-impact actions.
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Top bar ------------------------------ */

function TopBar({ stage }) {
  const statusLabel = stage >= 6 ? "All systems healthy" : stage >= 1 ? "1 incident under investigation" : "1 active incident";
  const tone = stage >= 6 ? "healthy" : "critical";
  return (
    <header className="topbar">
      <div className={`topbar-status pill-${tone === "healthy" ? "healthy" : "critical"}`}>
        <StatusDot status={tone} />
        {statusLabel}
      </div>
      <div className="topbar-right">
        <button className="icon-btn" aria-label="Notifications">
          🔔
        </button>
        <div className="user-chip">
          <div className="avatar">IA</div>
          <div className="user-meta">
            <div className="user-name">Admin</div>
            <div className="user-role">Infrastructure Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Dashboard ------------------------------ */

function Dashboard({ stage, onInvestigate, goto }) {
  const resolved = stage >= 6;
  const health = [
    { name: "Network", status: "healthy" },
    { name: "Applications", status: resolved ? "healthy" : "critical" },
    { name: "Servers", status: "warning" },
    { name: "Database", status: resolved ? "healthy" : "critical" },
    { name: "IoT Sensors", status: "healthy" },
    { name: "Facility Systems", status: "healthy" },
    { name: "Power", status: "healthy" },
    { name: "Cooling", status: "healthy" },
  ];

  return (
    <div className="page">
      <div className="hero">
        <SectionEyebrow>Operations overview</SectionEyebrow>
        <h1 className="hero-title">
          {resolved ? "Everything's back on its feet." : "One service needs a hand right now."}
        </h1>
        <p className="hero-sub">
          Lifeline watches every signal across your infrastructure and steps in the moment something starts to fail —
          diagnosing, testing a fix, and asking you before it touches production.
        </p>
      </div>

      <div className="kpi-grid">
        <Card>
          <div className="kpi-label">Infrastructure health</div>
          <div className="kpi-value" style={{ color: resolved ? "var(--green)" : "var(--amber)" }}>
            {resolved ? "94%" : "78%"}
          </div>
          <div className="kpi-hint">across 8 monitored systems</div>
        </Card>
        <Card>
          <div className="kpi-label">Active incidents</div>
          <div className="kpi-value" style={{ color: resolved ? "var(--ink)" : "var(--coral)" }}>
            {resolved ? "0" : "1"}
          </div>
          <div className="kpi-hint">{resolved ? "last one resolved" : "Student Portal degradation"}</div>
        </Card>
        <Card>
          <div className="kpi-label">Critical alerts</div>
          <div className="kpi-value" style={{ color: resolved ? "var(--ink)" : "var(--coral)" }}>
            {resolved ? "0" : "2"}
          </div>
          <div className="kpi-hint">database + application tier</div>
        </Card>
        <Card>
          <div className="kpi-label">Healthy services</div>
          <div className="kpi-value" style={{ color: "var(--green)" }}>
            {resolved ? "8 / 8" : "6 / 8"}
          </div>
          <div className="kpi-hint">no action needed</div>
        </Card>
        <Card>
          <div className="kpi-label">AI recommendations</div>
          <div className="kpi-value">{resolved ? "0" : "3"}</div>
          <div className="kpi-hint">ranked by confidence</div>
        </Card>
        <Card>
          <div className="kpi-label">Pending approvals</div>
          <div className="kpi-value" style={{ color: stage >= 4 && stage < 5 ? "var(--coral)" : "var(--ink)" }}>
            {stage >= 4 && stage < 5 ? "1" : "0"}
          </div>
          <div className="kpi-hint">awaiting a human</div>
        </Card>
      </div>

      <div className="two-col">
        <Card className="span-2">
          <div className="card-head">
            <h3>Infrastructure health</h3>
            <span className="muted-text">live signal per system</span>
          </div>
          <div className="health-grid">
            {health.map((h) => (
              <div className="health-row" key={h.name}>
                <span>{h.name}</span>
                <StatusPill status={h.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="incident-card">
          <div className="incident-card-head">
            <StatusPill status={resolved ? "healthy" : "critical"} />
            <span className="incident-id">INC-2049</span>
          </div>
          <h3 className="incident-title">Student Portal Service Degradation</h3>
          <dl className="incident-meta">
            <div>
              <dt>Started</dt>
              <dd>{fmtTime(0)}</dd>
            </div>
            <div>
              <dt>Affected service</dt>
              <dd>Student Portal</dd>
            </div>
            <div>
              <dt>Severity</dt>
              <dd>{resolved ? "Resolved" : "Critical"}</dd>
            </div>
            <div>
              <dt>Affected users</dt>
              <dd>~4,200</dd>
            </div>
            <div>
              <dt>Current health</dt>
              <dd>{resolved ? "Stable" : "Degraded"}</dd>
            </div>
          </dl>
          <button className="btn-coral btn-block" onClick={onInvestigate}>
            {resolved ? "View incident report" : "Investigate Incident"}
          </button>
        </Card>
      </div>

      <Card className="flow-strip">
        <div className="card-head">
          <h3>How Lifeline gets you back online</h3>
        </div>
        <FlowStrip stage={stage} />
      </Card>
    </div>
  );
}

const FLOW_STEPS = ["Detect", "Correlate", "Diagnose", "Recommend", "Simulate", "Approve", "Recover", "Audit"];

function FlowStrip({ stage }) {
  const activeIndex = Math.min(stage + 1, FLOW_STEPS.length - 1);
  return (
    <div className="flow-track">
      {FLOW_STEPS.map((s, i) => (
        <Fragment key={s}>
          <div className={`flow-step ${i <= activeIndex ? "flow-step-done" : ""}`}>
            <div className="flow-dot">{i + 1}</div>
            <span>{s}</span>
          </div>
          {i < FLOW_STEPS.length - 1 && <div className={`flow-line ${i < activeIndex ? "flow-line-done" : ""}`} />}
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------ Incidents list ------------------------------ */

function IncidentsList({ onInvestigate, stage }) {
  const resolved = stage >= 6;
  return (
    <div className="page">
      <SectionEyebrow>Incidents</SectionEyebrow>
      <h1 className="page-title">All incidents</h1>
      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Service</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Started</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">INC-2049</td>
              <td>Student Portal</td>
              <td><StatusPill status={resolved ? "healthy" : "critical"} /></td>
              <td>{resolved ? "Resolved" : stage >= 1 ? "Investigating" : "New"}</td>
              <td className="mono">{fmtTime(0)}</td>
              <td>
                <button className="btn-ghost" onClick={onInvestigate}>
                  {resolved ? "View report" : "Investigate"}
                </button>
              </td>
            </tr>
            <tr className="muted-row">
              <td className="mono">INC-2041</td>
              <td>Payments Gateway</td>
              <td><StatusPill status="healthy" /></td>
              <td>Resolved</td>
              <td className="mono">Yesterday, 09:14</td>
              <td>
                <button className="btn-ghost" disabled>
                  View report
                </button>
              </td>
            </tr>
            <tr className="muted-row">
              <td className="mono">INC-2038</td>
              <td>Facility Cooling — Block C</td>
              <td><StatusPill status="healthy" /></td>
              <td>Resolved</td>
              <td className="mono">2 days ago</td>
              <td>
                <button className="btn-ghost" disabled>
                  View report
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ------------------------------ Root cause ------------------------------ */

function RootCause({ stage, sensorDown, setSensorDown, confidence, goto }) {
  const analyzing = stage < 1;

  const evidenceFull = [
    { label: "Database connection utilization", value: "98%", tone: "critical" },
    { label: "API latency", value: "+340%", tone: "critical" },
    { label: "Error rate", value: "+18%", tone: "critical" },
    { label: "Network packet loss", value: "Normal", tone: "healthy" },
    { label: "Server CPU", value: "Normal", tone: "healthy" },
    { label: "Historical similarity", value: "High", tone: "warning" },
  ];

  return (
    <div className="page">
      <SectionEyebrow>Root cause analysis · INC-2049</SectionEyebrow>
      <h1 className="page-title">Student Portal is experiencing high latency and errors.</h1>

      {analyzing ? (
        <Card className="analyzing-card">
          <div className="analyzing-row">
            <span className="spinner" />
            <span>Correlating network, application, database and historical signals…</span>
          </div>
        </Card>
      ) : (
        <Fragment>
          <div className="two-col">
            <Card className="span-2">
              <div className="card-head">
                <h3>Causal chain</h3>
                <span className="muted-text">what led to the incident</span>
              </div>
              <CausalChain />
            </Card>

            <Card>
              <div className="rc-badge">Likely root cause</div>
              <h2 className="rc-title">Database Connection Saturation</h2>
              <div className="confidence-row">
                <span>AI confidence</span>
                <strong style={{ color: sensorDown ? "var(--amber)" : "var(--green)" }}>{confidence}%</strong>
              </div>
              <div className="confidence-bar-track">
                <div
                  className="confidence-bar-fill"
                  style={{ width: `${confidence}%`, background: sensorDown ? "var(--amber)" : "var(--green)" }}
                />
              </div>
              {sensorDown && (
                <div className="degraded-banner">
                  Temperature telemetry is currently unavailable. Diagnosis continues using application, database,
                  network and historical evidence. Confidence lowered from 89% to 74%.
                </div>
              )}
              <div className="alt-hypotheses">
                <span className="muted-text">Alternative hypotheses</span>
                <div className="alt-row">
                  <span>Network failure</span>
                  <span className="mono">8%</span>
                </div>
                <div className="alt-row">
                  <span>Application bug</span>
                  <span className="mono">3%</span>
                </div>
              </div>
              <button className="btn-coral btn-block" onClick={() => goto("recovery")}>
                View Recovery Options
              </button>
            </Card>
          </div>

          <Card>
            <div className="card-head">
              <h3>Supporting evidence</h3>
              <label className="toggle-label">
                <input type="checkbox" checked={sensorDown} onChange={(e) => setSensorDown(e.target.checked)} />
                Simulate temperature sensor failure
              </label>
            </div>
            <div className="evidence-grid">
              {evidenceFull.map((e) => (
                <div className="evidence-item" key={e.label}>
                  <span>{e.label}</span>
                  <StatusPill status={e.tone} />
                  <span className="mono">{e.value}</span>
                </div>
              ))}
              <div className={`evidence-item ${sensorDown ? "evidence-unavailable" : ""}`}>
                <span>Temperature sensors</span>
                {sensorDown ? <StatusPill status="unavailable" /> : <StatusPill status="healthy" />}
                <span className="mono">{sensorDown ? "—" : "Normal"}</span>
              </div>
            </div>
          </Card>
        </Fragment>
      )}
    </div>
  );
}

function CausalChain() {
  const chain = [
    "Application Errors ↑",
    "Database Latency ↑",
    "Connection Pool Utilization 98%",
    "Database Overload",
    "Student Portal Degradation",
  ];
  return (
    <div className="chain">
      {chain.map((c, i) => (
        <Fragment key={c}>
          <div className="chain-node">{c}</div>
          {i < chain.length - 1 && <div className="chain-connector" />}
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------ Telemetry ------------------------------ */

function Telemetry({ sensorDown, setSensorDown }) {
  const [openSource, setOpenSource] = useState(null);
  const sources = [
    { name: "Network Telemetry", status: "healthy", sample: ["Packet loss: 0.01%", "Latency: 4ms avg", "Throughput: nominal"] },
    { name: "Application Telemetry", status: "critical", sample: ["Error rate: 18%", "Response time: 8.2s p95", "5xx spike since 18:29"] },
    { name: "Server Metrics", status: "warning", sample: ["CPU: 61%", "Memory: 74%", "Disk I/O: elevated"] },
    { name: "Database Metrics", status: "critical", sample: ["Connections: 98% of pool", "Query latency: +340%", "Lock waits: rising"] },
    {
      name: "Temperature Sensors",
      status: sensorDown ? "unavailable" : "healthy",
      sample: sensorDown ? ["No data — sensor offline since 18:31"] : ["Server room: 21.4°C", "Rack B: 22.1°C"],
    },
    { name: "Power Sensors", status: "healthy", sample: ["Load: 62%", "UPS: online", "No fluctuations"] },
    { name: "Facility Alarms", status: "healthy", sample: ["No active alarms", "Access log: normal"] },
    { name: "IoT Sensors", status: "healthy", sample: ["All 214 devices reporting", "No anomalies"] },
  ];

  return (
    <div className="page">
      <SectionEyebrow>Telemetry</SectionEyebrow>
      <h1 className="page-title">Data sources behind every diagnosis</h1>
      <p className="page-sub">
        Lifeline correlates evidence across every one of these feeds instead of trusting a single source. Select a
        source to see what it's reporting right now.
      </p>

      <Card>
        <label className="toggle-label">
          <input type="checkbox" checked={sensorDown} onChange={(e) => setSensorDown(e.target.checked)} />
          Simulate temperature sensor going offline (degraded data mode)
        </label>
      </Card>

      <div className="source-grid">
        {sources.map((s) => (
          <Card key={s.name} className={`source-card ${openSource === s.name ? "source-card-open" : ""}`}>
            <button className="source-head" onClick={() => setOpenSource(openSource === s.name ? null : s.name)}>
              <span>{s.name}</span>
              <StatusPill status={s.status} />
            </button>
            {openSource === s.name && (
              <ul className="source-sample">
                {s.sample.map((line) => (
                  <li key={line} className="mono">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Recovery ------------------------------ */

function Recovery({ goto, setStage }) {
  const options = [
    { name: "Restart database", risk: "High", result: "Possible recovery", confidence: 72 },
    { name: "Switch traffic to backup DB", risk: "Medium", result: "Service recovery", confidence: 91, recommended: true },
    { name: "Increase connection pool", risk: "Low", result: "Partial recovery", confidence: 84 },
  ];

  return (
    <div className="page">
      <SectionEyebrow>Recovery recommendations · INC-2049</SectionEyebrow>
      <h1 className="page-title">Three ways to recover — one clear best option</h1>

      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Recovery action</th>
              <th>Risk</th>
              <th>Expected result</th>
              <th>AI confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.name} className={o.recommended ? "row-recommended" : ""}>
                <td>
                  {o.name}
                  {o.recommended && <span className="tag-recommended">Recommended</span>}
                </td>
                <td>
                  <span className={`risk-chip risk-${o.risk.toLowerCase()}`}>{o.risk}</span>
                </td>
                <td>{o.result}</td>
                <td className="mono">{o.confidence}%</td>
                <td>
                  {o.recommended ? (
                    <button
                      className="btn-coral"
                      onClick={() => {
                        setStage((s) => Math.max(s, 2));
                        goto("sandbox");
                      }}
                    >
                      Simulate in Sandbox
                    </button>
                  ) : (
                    <button className="btn-ghost" disabled>
                      Select
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="card-head">
          <h3>Why "Switch traffic to Backup Database"?</h3>
        </div>
        <div className="why-grid">
          <div>
            <span className="muted-text">Expected impact</span>
            <p>Removes load from the saturated primary connection pool immediately.</p>
          </div>
          <div>
            <span className="muted-text">Risk</span>
            <p>Medium — requires a brief traffic cutover.</p>
          </div>
          <div>
            <span className="muted-text">Estimated downtime</span>
            <p>Under 30 seconds during migration.</p>
          </div>
          <div>
            <span className="muted-text">Required approval</span>
            <p>Infrastructure Administrator sign-off.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Sandbox ------------------------------ */

function Sandbox({ simRunning, simDone, runSimulation, goto }) {
  return (
    <div className="page">
      <SectionEyebrow>Sandbox simulation</SectionEyebrow>
      <h1 className="page-title">Test the fix before it touches production</h1>

      <div className="two-col">
        <Card>
          <h3>Current state</h3>
          <MetricRow label="Portal latency" value="8.2s" tone="critical" />
          <MetricRow label="Error rate" value="18%" tone="critical" />
          <MetricRow label="Database connections" value="98%" tone="critical" />
        </Card>
        <Card>
          <h3>Proposed action</h3>
          <p className="proposed-action">Switch production traffic to backup database</p>
          {!simDone && (
            <button className="btn-coral btn-block" onClick={runSimulation} disabled={simRunning}>
              {simRunning ? "Running simulation…" : "Run Simulation"}
            </button>
          )}
          {simRunning && (
            <div className="sim-progress">
              <div className="sim-progress-bar" />
            </div>
          )}
        </Card>
      </div>

      {simDone && (
        <Card className="sim-result-card">
          <div className="card-head">
            <h3>Simulated result</h3>
            <span className="pill-healthy status-pill">
              <StatusDot status="healthy" /> Simulation Successful
            </span>
          </div>
          <div className="two-col">
            <MetricRow label="Portal latency" value="1.1s" tone="healthy" />
            <MetricRow label="Error rate" value="1.2%" tone="healthy" />
          </div>
          <MetricRow label="Database load" value="42%" tone="healthy" />
          <div className="degraded-banner sandbox-note">
            This result was generated in a sandbox and has not changed production infrastructure.
          </div>
          <button className="btn-coral btn-block" onClick={() => goto("approvals")}>
            Continue to Approval
          </button>
        </Card>
      )}
    </div>
  );
}

function MetricRow({ label, value, tone }) {
  const colorMap = { critical: "var(--coral)", healthy: "var(--green)", warning: "var(--amber)" };
  return (
    <div className="metric-row">
      <span>{label}</span>
      <span className="mono" style={{ color: colorMap[tone], fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------ Approvals ------------------------------ */

function Approvals({ approvalResult, approve, reject, confidence }) {
  return (
    <div className="page">
      <SectionEyebrow>Human approval</SectionEyebrow>
      <h1 className="page-title">A human decides — Lifeline never acts alone on production</h1>

      <Card className="approval-card">
        <div className="approval-banner">Human Approval Required</div>
        <div className="approval-grid">
          <div>
            <span className="muted-text">Action</span>
            <p className="approval-value">Switch production traffic to backup database</p>
          </div>
          <div>
            <span className="muted-text">Risk</span>
            <p className="approval-value">Medium</p>
          </div>
          <div>
            <span className="muted-text">AI confidence</span>
            <p className="approval-value">91%</p>
          </div>
          <div>
            <span className="muted-text">Simulation</span>
            <p className="approval-value" style={{ color: "var(--green)" }}>
              Successful
            </p>
          </div>
          <div>
            <span className="muted-text">Expected downtime</span>
            <p className="approval-value">Under 30 seconds</p>
          </div>
          <div>
            <span className="muted-text">Expected improvement</span>
            <p className="approval-value" style={{ color: "var(--green)" }}>
              High
            </p>
          </div>
        </div>

        {!approvalResult && (
          <div className="approval-actions">
            <button className="btn-coral" onClick={approve}>
              Approve Recovery
            </button>
            <button className="btn-outline" onClick={reject}>
              Reject Recovery
            </button>
          </div>
        )}
        {approvalResult === "rejected" && (
          <div className="degraded-banner">Recovery rejected. No production change was made. Incident remains open.</div>
        )}
        {approvalResult === "approved" && (
          <div className="degraded-banner" style={{ borderColor: "var(--green)", background: "#EAF7F0" }}>
            Approved. Executing recovery — see the Recovery Execution page.
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------ Execution ------------------------------ */

const EXEC_STEPS = [
  "Approval verified",
  "Recovery command authorized",
  "Backup database validated",
  "Traffic migration started",
  "Traffic migration completed",
  "Service health verified",
];

function Execution({ execStep, execRunning, stage, goto }) {
  const resolved = stage >= 6;
  return (
    <div className="page">
      <SectionEyebrow>Recovery execution · INC-2049</SectionEyebrow>
      <h1 className="page-title">{resolved ? "Service Restored Successfully" : "Executing recovery…"}</h1>

      <Card>
        <ul className="exec-list">
          {EXEC_STEPS.map((s, i) => (
            <li key={s} className={i < execStep ? "exec-done" : i === execStep && execRunning ? "exec-active" : ""}>
              <span className="exec-check">{i < execStep ? "✓" : i + 1}</span>
              {s}
            </li>
          ))}
        </ul>
      </Card>

      {resolved && (
        <Card>
          <div className="card-head">
            <h3>Before / after</h3>
          </div>
          <div className="two-col">
            <div>
              <span className="muted-text">Before</span>
              <MetricRow label="Latency" value="8.2s" tone="critical" />
              <MetricRow label="Error rate" value="18%" tone="critical" />
            </div>
            <div>
              <span className="muted-text">After</span>
              <MetricRow label="Latency" value="1.1s" tone="healthy" />
              <MetricRow label="Error rate" value="1.2%" tone="healthy" />
            </div>
          </div>
          <button className="btn-coral btn-block" onClick={() => goto("audit")}>
            View Audit Trail
          </button>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ Audit trail ------------------------------ */

function AuditTrail({ stage, sensorDown, approvalResult }) {
  const events = [
    { t: 0, actor: "Lifeline AI", action: "Incident detected", result: "Student Portal degradation flagged" },
    { t: 5, actor: "Lifeline AI", action: "AI analysis started", result: "Correlating 8 telemetry sources" },
    { t: 10, actor: "Lifeline AI", action: "Root cause identified", result: `Database connection saturation (${sensorDown ? 74 : 89}% confidence)` },
    { t: 16, actor: "Lifeline AI", action: "Recovery options generated", result: "3 options ranked by confidence" },
    { t: 23, actor: "Lifeline AI", action: "Sandbox simulation started", result: "Switch traffic to backup DB" },
    { t: 30, actor: "Lifeline AI", action: "Simulation successful", result: "Latency 8.2s → 1.1s (sandboxed)" },
    { t: 36, actor: "Lifeline AI", action: "Human approval requested", result: "Awaiting Infrastructure Administrator" },
  ];
  if (approvalResult === "approved") {
    events.push({ t: 58, actor: "Administrator", action: "Approved action", result: "Recovery authorized", human: true });
    events.push({ t: 66, actor: "Lifeline AI", action: "Recovery executed", result: "Traffic migrated to backup DB" });
    events.push({ t: 101, actor: "Lifeline AI", action: "Service restored", result: "Latency 8.2s → 1.1s" });
  } else if (approvalResult === "rejected") {
    events.push({ t: 58, actor: "Administrator", action: "Rejected action", result: "No production change made", human: true });
  }

  return (
    <div className="page">
      <SectionEyebrow>Audit trail · INC-2049</SectionEyebrow>
      <h1 className="page-title">Every decision, timestamped and attributed</h1>
      <Card>
        <div className="audit-timeline">
          {events.map((e, i) => (
            <div className="audit-row" key={i}>
              <div className="audit-time mono">{fmtTime(e.t)}</div>
              <div className="audit-dot-col">
                <span className={`audit-dot ${e.human ? "audit-dot-human" : "audit-dot-ai"}`} />
                {i < events.length - 1 && <span className="audit-connector" />}
              </div>
              <div className="audit-body">
                <div className="audit-top">
                  <strong>{e.action}</strong>
                  <span className={`audit-actor ${e.human ? "audit-actor-human" : "audit-actor-ai"}`}>
                    {e.human ? "Human action" : "AI action"} · {e.actor}
                  </span>
                </div>
                <div className="muted-text">{e.result}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Expose the finished component tree so app.js can mount it.
window.LifelineApp = App;
