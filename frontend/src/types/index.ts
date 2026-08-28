export type Role = 'STUDENT' | 'WARDEN' | 'ADMIN';

export type ComplaintCategory =
  | 'WIFI_INTERNET' | 'AC_COOLING' | 'WATER_COOLER' | 'WASHROOM'
  | 'WALL_STRUCTURAL' | 'FIRE_ALARM' | 'CCTV_SECURITY' | 'ELECTRICAL' | 'OTHER';

export type ComplaintStatus =
  | 'SUBMITTED' | 'AI_ANALYZED' | 'UNDER_REVIEW' | 'APPROVAL_REQUIRED'
  | 'ACTION_APPROVED' | 'ACTION_REJECTED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ActorType = 'STUDENT' | 'WARDEN' | 'ADMIN' | 'AI' | 'SYSTEM';
export type SimulationResultType = 'SUCCESSFUL' | 'PARTIAL_SUCCESS' | 'FAILED' | 'PENDING';
export type AssetStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface RiskAssessment {
  severity: Severity;
  confidencePercent: number;
  riskScore: number;
  riskLevel: RiskLevel;
  probableRootCause: string;
  explanation: string;
  impactScore: number;
  probabilityScore: number;
  affectedStudentsEstimate: number;
  safetyRiskScore: number;
  reversibilityScore: number;
  telemetryDegraded: boolean;
  telemetryNote?: string;
}

export interface RecommendedAction {
  id: string;
  actionName: string;
  description: string;
  riskScore: number;
  rank: number;
  estimatedRecoveryTime: string;
  reversible: boolean;
  isChosen: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  hostelBlock: string;
  floor?: string;
  room?: string;
  imageUrl?: string;
  reportedByName: string;
  reportedById: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  riskAssessment?: RiskAssessment;
  recommendedActions: RecommendedAction[];
}

export interface Simulation {
  id: string;
  actionId: string;
  actionName: string;
  currentState: string;
  proposedAction: string;
  expectedImpact: string;
  affectedStudents: number;
  estimatedRecovery: string;
  failureProbabilityPercent: number;
  rollbackAvailable: boolean;
  predictedResult: SimulationResultType;
  runAt: string;
}

export interface Approval {
  id: string;
  complaintId: string;
  complaintTitle: string;
  actionId: string;
  actionName: string;
  riskScore: number;
  status: ApprovalStatus;
  decidedByName?: string;
  comment?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  complaintId?: string;
  actorType: ActorType;
  actorName: string;
  event: string;
  details?: string;
  riskSnapshot?: string;
  actionSnapshot?: string;
  resultSnapshot?: string;
  timestamp: string;
}

export interface InfrastructureHealth {
  name: string;
  healthPercent: number;
  status: AssetStatus;
  hostelBlock: string;
}

export interface DashboardSummary {
  totalComplaints: number;
  criticalIssues: number;
  pendingApprovals: number;
  resolvedToday: number;
  averageRisk: number;
  infrastructureHealth: InfrastructureHealth[];
}

export interface AnalyticsData {
  complaintsByCategory: Record<string, number>;
  complaintsByStatus: Record<string, number>;
  riskDistribution: Record<string, number>;
  complaintsOverTime: { date: string; count: number }[];
  avgResolutionHoursByCategory: Record<string, number>;
  mostProblematicLocations: { location: string; count: number }[];
}
