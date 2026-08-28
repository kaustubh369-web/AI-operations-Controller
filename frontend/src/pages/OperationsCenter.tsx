import { useEffect, useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, Gauge } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import HealthGauge from '../components/HealthGauge';
import { SkeletonCard } from '../components/Skeleton';
import { AnalyticsApi } from '../api/endpoints';
import type { DashboardSummary } from '../types';

export default function OperationsCenter() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsApi.summary().then(setSummary).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Hostel Operations Center</h1>
        <p className="text-sm text-slate-500 mt-1">Live infrastructure health & incident overview.</p>
      </div>

      {loading || !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Complaints" value={summary.totalComplaints} icon={Gauge} />
          <StatCard label="Critical Issues" value={summary.criticalIssues} icon={AlertOctagon} accent="rose" />
          <StatCard label="Pending Approvals" value={summary.pendingApprovals} icon={ShieldAlert} accent="amber" />
          <StatCard label="Resolved Today" value={summary.resolvedToday} icon={CheckCircle2} accent="emerald" />
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4">Infrastructure Health</h3>
        {loading || !summary ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.infrastructureHealth.map((a) => <HealthGauge key={a.name} asset={a} />)}
          </div>
        )}
      </div>

      {!loading && summary && (
        <div className="glass-card p-5 mt-6">
          <p className="text-sm text-slate-400">
            Average risk score across all triaged complaints: <span className="text-slate-100 font-semibold">{summary.averageRisk}/100</span>
          </p>
        </div>
      )}
    </Layout>
  );
}
