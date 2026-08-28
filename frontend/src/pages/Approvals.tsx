import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { ApprovalApi } from '../api/endpoints';
import type { Approval } from '../types';
import { formatDateTime } from '../lib/format';

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ApprovalApi.pending().then(setApprovals).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Pending Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">High-impact recovery actions waiting on warden sign-off.</p>
      </div>

      {loading ? (
        <div className="glass-card overflow-hidden">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
      ) : approvals.length === 0 ? (
        <div className="glass-card"><EmptyState icon={ShieldAlert} title="Nothing pending" description="All recommended actions are within auto-execute risk thresholds, or already decided." /></div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => (
            <div key={a.id} className="glass-card p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-accent-500/30 transition"
              onClick={() => navigate(`/complaints/${a.complaintId}`)}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 truncate">{a.complaintTitle}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{a.actionName}</p>
                  <p className="text-xs text-slate-500 mt-1">Risk {a.riskScore}/100 · Requested {formatDateTime(a.requestedAt)}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-600 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
