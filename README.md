# LifeLine — by Cognora

**Smarter Hostels. Safer Living.**

A human-governed AI Operations Center for hostel infrastructure. Students report problems (Wi-Fi,
AC, structural, fire safety, CCTV, plumbing, electrical...); a deterministic rule-based AI engine
diagnoses a probable root cause, scores risk, and ranks recovery actions from safest to riskiest;
low-risk fixes are simulated and auto-resolved; medium/high/critical actions are **sandboxed
first** and require explicit warden approval before anything is marked executed. Every step is
written to an immutable audit trail.

> **This is a hackathon simulation.** LifeLine never controls real infrastructure — no router,
> alarm panel, camera, or electrical system is ever actually touched. "Execution" always means a
> simulated, logged outcome.

---

## Architecture

```
lifeline-v2/
├── backend/     Java 21 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA · PostgreSQL · Swagger
├── frontend/    React 18 · Vite · TypeScript · Tailwind CSS · React Router · Axios · Recharts · Framer Motion
└── docker-compose.yml   PostgreSQL only — everything else runs natively
```

### The pipeline

```
REPORT → AI ANALYZE → ROOT CAUSE → RISK SCORE → RANK ACTIONS → SANDBOX SIMULATE
       → HUMAN APPROVAL (if risk ≥ MEDIUM) → SIMULATED EXECUTION → AUDIT → RESOLVE
```

- **LOW** risk → simulated and auto-resolved immediately (self-healing).
- **MEDIUM / HIGH / CRITICAL** → routed to `APPROVAL_REQUIRED`; a warden must approve before the
  safest ranked action is simulated, "executed," and the incident resolved.
- Every AI step, risk assessment, simulation, approval decision, and resolution is written to
  `audit_logs` with an actor, timestamp, and snapshot.

---

## 1. Start PostgreSQL

```bash
cd lifeline-v2
docker compose up -d
```

(Or point `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` at any Postgres 14+ instance you already have.)

## 2. Run the backend

```bash
cd backend
cp .env.example .env      # then edit if needed
mvn spring-boot:run        # or: ./mvnw spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- On first boot, `DataSeeder` creates demo accounts, 8 infrastructure assets, and 7 realistic
  complaints (already run through the full AI → risk → action pipeline) — so the app is instantly
  demo-ready. Set `SEED_DEMO_DATA=false` to skip.

### Environment variables (backend/.env.example)

| Variable | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/lifeline` | |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | |
| `JWT_SECRET` | *(dev default provided)* | **Change in production.** |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | |
| `PORT` | `8080` | |
| `SEED_DEMO_DATA` | `true` | |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | comma-separated |

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

Open `http://localhost:5173`.

---

## Demo accounts

Seeded automatically (password for all three: `Lifeline@123`):

| Role | Email |
|---|---|
| Student | `student@lifeline.demo` |
| Warden | `warden@lifeline.demo` |
| Admin | `admin@lifeline.demo` |

The login page also has one-click buttons that fill these in.

---

## Core demo flow (~90 seconds)

1. Sign in as **student**, click **Report Issue**, submit *"Wi-Fi unavailable in Block A"* — watch
   the AI processing animation, then see root cause, risk score (HIGH), and ranked actions.
2. Sign out, sign in as **warden** → **Operations Center** (infrastructure health, live stats) →
   **Approvals** → open the pending Wi-Fi approval.
3. Click **Run sandbox simulation** on the top-ranked action — see predicted affected students,
   recovery time, failure probability, rollback availability.
4. Click **Approve & Execute** — the action is marked executed (simulated), the complaint moves to
   **Resolved**, and a notification is queued for the student.
5. Open **Audit Trail** — every step (Complaint Created → AI Analysis Completed → Risk Assessed →
   Action Recommended → Simulation Started/Completed → Approval Requested → Action Approved →
   Action Executed → Incident Resolved) is there with timestamps and actors.
6. Try reporting *"Large wall crack, growing"* to see a **CRITICAL** severity result with mandatory
   approval, or a furniture complaint to see the **LOW**-risk auto-resolve path.

---

## API surface

All endpoints are documented in Swagger (`/swagger-ui.html`). Summary:

| Base path | Purpose | Access |
|---|---|---|
| `/api/auth` | register, login | public |
| `/api/complaints` | submit, list, get, escalate, resolve | student (own) / warden+admin (all) |
| `/api/ai` | re-run analysis pipeline | warden+admin |
| `/api/risk` | risk assessment lookup | authenticated |
| `/api/simulations` | run/list sandbox simulations | warden+admin |
| `/api/approvals` | list pending, approve/reject | warden+admin |
| `/api/audit` | full event trail | warden+admin |
| `/api/analytics` | dashboard summary + chart data | warden+admin |
| `/api/admin` | user & role management | admin |
| `/api/notifications` | per-user notification feed | authenticated |

## Security

- Stateless JWT auth (`Authorization: Bearer <token>`), 24h expiry by default.
- Passwords hashed with BCrypt.
- Role-based route protection both server-side (`SecurityConfig` + `@PreAuthorize`) and
  client-side (`ProtectedRoute`).
- Students can only ever read their own complaints (`403` otherwise); wardens/admins can read and
  act on all.

## Fault tolerance

The CCTV/Security rule occasionally simulates degraded telemetry (~35% of runs) to demonstrate
graceful degradation: confidence drops and a note like *"CCTV telemetry unavailable — diagnosis
confidence reduced, but analysis continues using complaint history and available infrastructure
signals"* is shown, instead of the pipeline failing outright.

## Swapping in a real AI model later

Everything downstream (risk engine, controllers, frontend) depends only on the shape of
`AiAnalysisService.AnalysisResult` — not on how it's produced. Replace the body of
`AiAnalysisService.analyze()` with a call to an LLM/API and nothing else needs to change.

## What's intentionally simplified for hackathon scope

- The AI engine is deterministic/rule-based (by design — see `AiAnalysisService`), not an LLM call.
- Image upload accepts a URL field rather than binary file storage; wire up S3/Supabase Storage/etc.
  behind `imageUrl` for a real deployment.
- Notifications are in-app only (a `notifications` table + feed) — no email/push/WhatsApp integration.
- `ddl-auto: update` is used for convenience; swap for Flyway/Liquibase migrations in production.
