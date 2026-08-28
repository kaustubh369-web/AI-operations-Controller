package com.cognora.lifeline.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalComplaints;
    private long criticalIssues;
    private long pendingApprovals;
    private long resolvedToday;
    private double averageRisk;
    private List<InfrastructureHealthResponse> infrastructureHealth;
}
