import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { ComplaintApi } from '../api/endpoints';
import type { Complaint, ComplaintStatus, RiskLevel } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS, timeAgo } from '../lib/format';
import { FileWarning } from 'lucide-react';

const STATUS_FILTERS: (ComplaintStatus | 'ALL')[] = ['ALL', 'UNDER_REVIEW', 'APPROVAL_REQUIRED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'];
const RISK_FILTERS: (RiskLevel | 'ALL')[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function IncidentsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    ComplaintApi.list().then(setComplaints).finally(() => setLoading(false));
  }, []);

  const filtered = complaints.filter((c) =>
    (statusFilter === 'ALL' || c.status === statusFilter) &&
    (riskFilter === 'ALL' || c.riskAssessment?.riskLevel === riskFilter)
  );

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Active Incidents</h1>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} of {complaints.length} shown</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select className="input-field !w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : STATUS_LABELS[s]}</option>)}
        </select>
        <select className="input-field !w-auto text-sm" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as any)}>
          {RISK_FILTERS.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All risk levels' : r}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_140px_120px_140px_100px_30px] gap-3 px-5 py-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-navy-700">
          <span>Complaint</span><span>Category</span><span>Risk</span><span>Status</span><span>Reported</span><span />
        </div>
        {loading ? (
          <>{[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}</>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileWarning} title="No incidents match these filters" />
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="grid md:grid-cols-[1fr_140px_120px_140px_100px_30px] gap-3 px-5 py-4 border-b border-navy-700 last:border-0 hover:bg-navy-700/20 cursor-pointer transition items-center"
              onClick={() => navigate(`/complaints/${c.id}`)}
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-100 truncate">{c.title}</p>
                <p className="text-xs text-slate-500 truncate">{c.hostelBlock}{c.room ? `, ${c.room}` : ''}</p>
              </div>
              <span className="text-xs text-slate-400 hidden md:block">{CATEGORY_LABELS[c.category]}</span>
              <div className="hidden md:block">{c.riskAssessment && <RiskBadge level={c.riskAssessment.riskLevel} />}</div>
              <span className="text-xs text-slate-400 hidden md:block">{STATUS_LABELS[c.status]}</span>
              <span className="text-xs text-slate-500 hidden md:block">{timeAgo(c.createdAt)}</span>
              <ChevronRight size={16} className="text-slate-600 hidden md:block" />
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
