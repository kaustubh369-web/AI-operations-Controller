import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Gauge, Brain, ListChecks, FlaskConical, ShieldCheck, ScrollText,
  CheckCircle2, XCircle, TriangleAlert, Wifi,
} from 'lucide-react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import StatusTimeline from '../components/StatusTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ComplaintApi, SimulationApi, ApprovalApi, AuditApi } from '../api/endpoints';
import type { Complaint, Simulation, Approval, AuditLogEntry, RecommendedAction } from '../types';
import { CATEGORY_LABELS, RISK_BAR_COLORS, SIMULATION_RESULT_COLORS, APPROVAL_STATUS_COLORS, formatDateTime } from '../lib/format';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [simRunning, setSimRunning] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ approvalId: string; approve: boolean } | null>(null);

  const isStaff = user?.role === 'WARDEN' || user?.role === 'ADMIN';

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await ComplaintApi.get(id);
      setComplaint(c);
      const [sims, apprs] = await Promise.all([
        SimulationApi.forComplaint(id),
        ApprovalApi.forComplaint(id),
      ]);
      setSimulations(sims);
      setApprovals(apprs);
      if (isStaff) setAudit(await AuditApi.forComplaint(id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  const runSimulation = async (action: RecommendedAction) => {
    if (!complaint) return;
    setSimRunning(action.id);
    try {
      const sim = await SimulationApi.run(complaint.id, action.id);
      setSimulations((prev) => [sim, ...prev]);
      push(`Simulation predicted: ${sim.predictedResult.replace('_', ' ')}`, sim.predictedResult === 'FAILED' ? 'error' : 'success');
    } catch (err: any) {
      push(err?.response?.data?.message || 'Simulation failed to run', 'error');
    } finally {
      setSimRunning(null);
    }
  };

  const decideApproval = async () => {
    if (!confirmAction) return;
    try {
      await ApprovalApi.decide(confirmAction.approvalId, confirmAction.approve);
      push(confirmAction.approve ? 'Action approved & executed in simulation.' : 'Action rejected.', 'success');
      await loadAll();
    } catch (err: any) {
      push(err?.response?.data?.message || 'Could not record decision', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  if (loading || !complaint) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-navy-700/60 rounded-lg" />
          <div className="h-40 bg-navy-700/60 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const risk = complaint.riskAssessment;
  const pendingApproval = approvals.find((a) => a.status === 'PENDING');

  return (
    <Layout>
      <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-5" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-accent-400 mb-1">{CATEGORY_LABELS[complaint.category]}</p>
          <h1 className="text-2xl font-bold text-slate-50">{complaint.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {complaint.hostelBlock}{complaint.floor ? `, ${complaint.floor}` : ''}{complaint.room ? `, Room ${complaint.room}` : ''} · reported by {complaint.reportedByName}
          </p>
        </div>
        {risk && <RiskBadge level={risk.riskLevel} score={risk.riskScore} />}
      </div>

      <div className="glass-card p-5 mb-6 overflow-x-auto">
        <StatusTimeline status={complaint.status} />
      </div>

      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2"><ScrollText size={16} className="text-accent-400" /> Description</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{complaint.description}</p>
      </div>

      {risk && (
        <div className="glass-card p-5 mb-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><Brain size={16} className="text-accent-400" /> AI Root-Cause Analysis</h3>
          <p className="text-slate-100 font-medium mb-1">{risk.probableRootCause}</p>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{risk.explanation}</p>
          {risk.telemetryDegraded && (
            <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-4">
              <TriangleAlert size={14} className="shrink-0 mt-0.5" /> {risk.telemetryNote}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Metric label="Confidence" value={`${risk.confidencePercent}%`} />
            <Metric label="Severity" value={risk.severity} />
            <Metric label="Impact" value={`${risk.impactScore}/100`} />
            <Metric label="Probability" value={`${risk.probabilityScore}/100`} />
            <Metric label="Affected students" value={`~${risk.affectedStudentsEstimate}`} />
            <Metric label="Safety risk" value={`${risk.safetyRiskScore}/100`} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span>RISK SCORE</span><span>{risk.riskScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-navy-900 overflow-hidden">
              <div className={`h-full ${RISK_BAR_COLORS[risk.riskLevel]}`} style={{ width: `${risk.riskScore}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><ListChecks size={16} className="text-accent-400" /> Recommended Recovery Actions (ranked safest → riskiest)</h3>
        <div className="space-y-3">
          {complaint.recommendedActions.map((a) => (
            <div key={a.id} className={`p-4 rounded-xl border ${a.isChosen ? 'border-accent-500/40 bg-accent-500/5' : 'border-navy-700 bg-navy-900/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">#{a.rank}</span>
                    <p className="font-medium text-slate-100">{a.actionName}</p>
                    {a.isChosen && <span className="text-[10px] font-mono uppercase text-accent-400 bg-accent-400/10 px-1.5 py-0.5 rounded">Executed</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{a.description}</p>
                  <p className="text-xs text-slate-500 mt-2">Recovery: {a.estimatedRecoveryTime} · {a.reversible ? 'Reversible' : 'Not reversible'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-slate-500">RISK</p>
                  <p className={`font-bold ${a.riskScore >= 60 ? 'text-rose-400' : a.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{a.riskScore}</p>
                </div>
              </div>
              {isStaff && (
                <button
                  className="btn-ghost text-xs mt-3 flex items-center gap-1.5"
                  disabled={simRunning === a.id}
                  onClick={() => runSimulation(a)}
                >
                  <FlaskConical size={13} /> {simRunning === a.id ? 'Simulating…' : 'Run sandbox simulation'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {simulations.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><FlaskConical size={16} className="text-accent-400" /> Simulation Results</h3>
          <div className="space-y-3">
            {simulations.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-navy-700 bg-navy-900/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-100 text-sm">{s.actionName}</p>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${SIMULATION_RESULT_COLORS[s.predictedResult]}`}>{s.predictedResult.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{formatDateTime(s.runAt)}</p>
                <p className="text-sm text-slate-400">{s.expectedImpact}</p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <Metric label="Recovery" value={s.estimatedRecovery} small />
                  <Metric label="Failure prob." value={`${s.failureProbabilityPercent}%`} small />
                  <Metric label="Rollback" value={s.rollbackAvailable ? 'Available' : 'None'} small />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isStaff && pendingApproval && (
        <div className="glass-card p-5 mb-6 border-amber-400/30">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-amber-400" /> High-Impact Action — Approval Required</h3>
          <p className="text-sm text-slate-300 mb-1">Action: <span className="font-medium">{pendingApproval.actionName}</span></p>
          <p className="text-sm text-slate-400 mb-4">Risk score: {pendingApproval.riskScore}/100</p>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2" onClick={() => setConfirmAction({ approvalId: pendingApproval.id, approve: true })}>
              <CheckCircle2 size={16} /> Approve &amp; Execute
            </button>
            <button className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold px-4 py-2.5 rounded-lg hover:bg-rose-500/20 transition flex items-center gap-2"
              onClick={() => setConfirmAction({ approvalId: pendingApproval.id, approve: false })}>
              <XCircle size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {approvals.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="font-semibold text-slate-200 mb-3">Approval History</h3>
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-navy-700 last:border-0 py-2">
                <span className="text-slate-300">{a.actionName}</span>
                <div className="flex items-center gap-2">
                  {a.decidedByName && <span className="text-xs text-slate-500">{a.decidedByName}</span>}
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${APPROVAL_STATUS_COLORS[a.status]}`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isStaff && audit.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><ScrollText size={16} className="text-accent-400" /> Audit Trail</h3>
          <div className="space-y-4">
            {audit.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-200">{entry.event}</p>
                    <span className="text-xs text-slate-500 shrink-0">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{entry.actorType} · {entry.actorName}</p>
                  {entry.details && <p className="text-sm text-slate-400 mt-1">{entry.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.approve ? 'Approve & execute this action?' : 'Reject this action?'}
        description={confirmAction?.approve
          ? 'This will run the simulated execution and mark the incident resolved.'
          : 'The warden will need to select an alternative recovery action.'}
        confirmLabel={confirmAction?.approve ? 'Approve & Execute' : 'Reject'}
        danger={!confirmAction?.approve}
        onConfirm={decideApproval}
        onCancel={() => setConfirmAction(null)}
      />
    </Layout>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={`bg-navy-900/60 rounded-lg ${small ? 'p-2' : 'p-3'}`}>
      <p className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">{label}</p>
      <p className={`font-semibold text-slate-200 ${small ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  );
}
