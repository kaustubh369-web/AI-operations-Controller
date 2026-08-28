import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { AnalyticsApi } from '../api/endpoints';
import type { AnalyticsData } from '../types';
import { CATEGORY_LABELS } from '../lib/format';

const RISK_PIE_COLORS: Record<string, string> = { LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#fb7185' };
const AXIS_COLOR = '#64748b';
const GRID_COLOR = '#1a2432';

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsApi.charts().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <Layout><div className="animate-pulse h-96 bg-navy-700/60 rounded-2xl" /></Layout>;
  }

  const categoryData = Object.entries(data.complaintsByCategory).map(([k, v]) => ({
    name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] || k, count: v,
  }));
  const riskData = Object.entries(data.riskDistribution).map(([k, v]) => ({ name: k, value: v }));
  const resolutionData = Object.entries(data.avgResolutionHoursByCategory).map(([k, v]) => ({
    name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] || k, hours: v,
  }));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Trends across all reported complaints.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Complaints by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ left: -20 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #243244', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {riskData.map((entry) => <Cell key={entry.name} fill={RISK_PIE_COLORS[entry.name] || '#64748b'} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
              <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #243244', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Complaints Over Time (14 days)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.complaintsOverTime} margin={{ left: -20 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: AXIS_COLOR, fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #243244', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg. Resolution Time by Category (hours)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={resolutionData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 10 }} width={110} />
              <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #243244', borderRadius: 8 }} />
              <Bar dataKey="hours" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Most Problematic Locations">
        <div className="space-y-2.5">
          {data.mostProblematicLocations.map((loc) => {
            const max = data.mostProblematicLocations[0]?.count || 1;
            return (
              <div key={loc.location}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{loc.location}</span>
                  <span className="text-slate-500 font-mono">{loc.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-navy-900 overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(loc.count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </Layout>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-slate-200 mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}
