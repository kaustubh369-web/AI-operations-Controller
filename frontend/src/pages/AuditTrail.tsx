import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { AuditApi } from '../api/endpoints';
import type { AuditLogEntry } from '../types';
import { formatDateTime } from '../lib/format';

const ACTOR_COLORS: Record<string, string> = {
  STUDENT: 'text-slate-300 bg-slate-400/10', WARDEN: 'text-accent-400 bg-accent-400/10',
  ADMIN: 'text-accent-400 bg-accent-400/10', AI: 'text-cyan-400 bg-cyan-400/10', SYSTEM: 'text-slate-500 bg-slate-500/10',
};

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    AuditApi.all().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">Every AI, warden, and system action across all complaints — immutable and timestamped.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <div className="glass-card"><EmptyState icon={ScrollText} title="No audit events yet" /></div>
      ) : (
        <div className="glass-card divide-y divide-navy-700">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-navy-700/20 cursor-pointer transition"
              onClick={() => log.complaintId && navigate(`/complaints/${log.complaintId}`)}>
              <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-md shrink-0 ${ACTOR_COLORS[log.actorType]}`}>{log.actorType}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">{log.event}</p>
                  <span className="text-xs text-slate-500 shrink-0">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="text-xs text-slate-500">{log.actorName}</p>
                {log.details && <p className="text-sm text-slate-400 mt-1 truncate">{log.details}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
