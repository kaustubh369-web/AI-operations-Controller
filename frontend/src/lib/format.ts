import type { ComplaintCategory, ComplaintStatus, RiskLevel, Severity, ApprovalStatus, SimulationResultType, AssetStatus } from '../types';

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  WIFI_INTERNET: 'Wi-Fi / Internet',
  AC_COOLING: 'AC / Cooling',
  WATER_COOLER: 'Water Cooler',
  WASHROOM: 'Washroom',
  WALL_STRUCTURAL: 'Wall / Structural',
  FIRE_ALARM: 'Fire Alarm',
  CCTV_SECURITY: 'CCTV / Security',
  ELECTRICAL: 'Electrical',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  AI_ANALYZED: 'AI Analyzed',
  UNDER_REVIEW: 'Under Review',
  APPROVAL_REQUIRED: 'Approval Required',
  ACTION_APPROVED: 'Action Approved',
  ACTION_REJECTED: 'Action Rejected',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
};

export const STATUS_FLOW: ComplaintStatus[] = [
  'SUBMITTED', 'AI_ANALYZED', 'UNDER_REVIEW', 'APPROVAL_REQUIRED',
  'ACTION_APPROVED', 'IN_PROGRESS', 'RESOLVED',
];

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  MEDIUM: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  HIGH: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  CRITICAL: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

export const SEVERITY_COLORS: Record<Severity, string> = RISK_COLORS as unknown as Record<Severity, string>;

export const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-rose-400',
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  REJECTED: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

export const SIMULATION_RESULT_COLORS: Record<SimulationResultType, string> = {
  SUCCESSFUL: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  PARTIAL_SUCCESS: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  FAILED: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  PENDING: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  HEALTHY: 'text-emerald-400',
  DEGRADED: 'text-amber-400',
  DOWN: 'text-rose-400',
  UNKNOWN: 'text-slate-400',
};

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
