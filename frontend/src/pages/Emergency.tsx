import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Construction, Zap, Camera, Siren, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { ComplaintApi } from '../api/endpoints';
import type { Complaint, ComplaintCategory } from '../types';
import { timeAgo } from '../lib/format';

const EMERGENCY_CATEGORIES: ComplaintCategory[] = ['FIRE_ALARM', 'WALL_STRUCTURAL', 'ELECTRICAL', 'CCTV_SECURITY'];
const CATEGORY_META: Record<string, { icon: typeof Flame; label: string }> = {
  FIRE_ALARM: { icon: Flame, label: 'Fire Alarm' },
  WALL_STRUCTURAL: { icon: Construction, label: 'Structural' },
  ELECTRICAL: { icon: Zap, label: 'Electrical' },
  CCTV_SECURITY: { icon: Camera, label: 'CCTV / Security' },
};

export default function Emergency() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ComplaintApi.list().then(setComplaints).finally(() => setLoading(false));
  }, []);

  const emergencyIncidents = complaints
    .filter((c) => EMERGENCY_CATEGORIES.includes(c.category) && c.status !== 'RESOLVED')
    .sort((a, b) => (b.riskAssessment?.riskScore || 0) - (a.riskAssessment?.riskScore || 0));

  const critical = emergencyIncidents.filter((c) => c.riskAssessment?.riskLevel === 'CRITICAL');

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
          <Siren size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Emergency Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">Fire, structural, electrical & security signals — highest priority first.</p>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 mb-6 flex items-center gap-2 text-rose-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          {critical.length} CRITICAL emergency signal{critical.length > 1 ? 's' : ''} require immediate attention
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      ) : emergencyIncidents.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={ShieldCheck} title="No active emergency signals" description="Fire, structural, electrical, and CCTV/security systems are all clear." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {emergencyIncidents.map((c) => {
            const meta = CATEGORY_META[c.category];
            const Icon = meta.icon;
            const isCritical = c.riskAssessment?.riskLevel === 'CRITICAL';
            return (
              <div
                key={c.id}
                className={`glass-card p-5 cursor-pointer transition hover:border-rose-400/40 ${isCritical ? 'border-rose-500/30' : ''}`}
                onClick={() => navigate(`/complaints/${c.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCritical ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-400/10 text-amber-400'}`}>
                    <Icon size={16} />
                  </div>
                  {isCritical && <span className="text-[10px] font-mono uppercase text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/30">Critical</span>}
                </div>
                <p className="font-semibold text-slate-100">{c.title}</p>
                <p className="text-xs text-slate-500 mt-1">{meta.label} · {c.hostelBlock} · {timeAgo(c.createdAt)}</p>
                {c.riskAssessment && (
                  <p className="text-sm text-slate-400 mt-3 line-clamp-2">{c.riskAssessment.probableRootCause}</p>
                )}
                <p className="text-xs text-slate-500 mt-3">Status: <span className="text-slate-300">{c.status.replace(/_/g, ' ')}</span></p>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
