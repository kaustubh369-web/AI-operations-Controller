import { api } from './client';
import type {
  AuthResponse, Complaint, ComplaintCategory, RiskAssessment, Simulation,
  Approval, AuditLogEntry, DashboardSummary, AnalyticsData,
} from '../types';

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),
  register: (payload: { fullName: string; email: string; password: string; hostelBlock?: string; floor?: string; room?: string; phone?: string }) =>
    api.post<AuthResponse>('/api/auth/register', payload).then((r) => r.data),
};

export const ComplaintApi = {
  submit: (payload: {
    category: ComplaintCategory; title: string; description: string;
    hostelBlock: string; floor?: string; room?: string; imageUrl?: string;
  }) => api.post<Complaint>('/api/complaints', payload).then((r) => r.data),
  list: () => api.get<Complaint[]>('/api/complaints').then((r) => r.data),
  get: (id: string) => api.get<Complaint>(`/api/complaints/${id}`).then((r) => r.data),
  escalate: (id: string) => api.post(`/api/complaints/${id}/escalate`),
  resolve: (id: string) => api.post(`/api/complaints/${id}/resolve`),
};

export const RiskApi = {
  forComplaint: (complaintId: string) =>
    api.get<RiskAssessment>(`/api/risk/complaint/${complaintId}`).then((r) => r.data),
};

export const SimulationApi = {
  run: (complaintId: string, actionId: string) =>
    api.post<Simulation>('/api/simulations/run', null, { params: { complaintId, actionId } }).then((r) => r.data),
  forComplaint: (complaintId: string) =>
    api.get<Simulation[]>(`/api/simulations/complaint/${complaintId}`).then((r) => r.data),
};

export const ApprovalApi = {
  pending: () => api.get<Approval[]>('/api/approvals/pending').then((r) => r.data),
  forComplaint: (complaintId: string) =>
    api.get<Approval[]>(`/api/approvals/complaint/${complaintId}`).then((r) => r.data),
  decide: (approvalId: string, approve: boolean, comment?: string) =>
    api.post<Approval>(`/api/approvals/${approvalId}/decide`, { approve, comment }).then((r) => r.data),
};

export const AuditApi = {
  forComplaint: (complaintId: string) =>
    api.get<AuditLogEntry[]>(`/api/audit/complaint/${complaintId}`).then((r) => r.data),
  all: () => api.get<AuditLogEntry[]>('/api/audit').then((r) => r.data),
};

export const AnalyticsApi = {
  summary: () => api.get<DashboardSummary>('/api/analytics/summary').then((r) => r.data),
  charts: () => api.get<AnalyticsData>('/api/analytics/charts').then((r) => r.data),
};
