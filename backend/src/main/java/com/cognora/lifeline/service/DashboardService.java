package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.DashboardSummaryResponse;
import com.cognora.lifeline.entity.ApprovalStatus;
import com.cognora.lifeline.entity.ComplaintStatus;
import com.cognora.lifeline.entity.RiskAssessment;
import com.cognora.lifeline.entity.RiskLevel;
import com.cognora.lifeline.repository.ApprovalRepository;
import com.cognora.lifeline.repository.ComplaintRepository;
import com.cognora.lifeline.repository.RiskAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ComplaintRepository complaintRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final ApprovalRepository approvalRepository;
    private final InfrastructureService infrastructureService;

    public DashboardSummaryResponse buildSummary() {
        long total = complaintRepository.count();
        List<RiskAssessment> assessments = riskAssessmentRepository.findAll();

        long critical = assessments.stream().filter(r -> r.getRiskLevel() == RiskLevel.CRITICAL).count();
        long pendingApprovals = approvalRepository.findByStatusOrderByRequestedAtDesc(ApprovalStatus.PENDING).size();

        Instant startOfToday = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
        long resolvedToday = complaintRepository.findByStatusOrderByCreatedAtDesc(ComplaintStatus.RESOLVED).stream()
                .filter(c -> c.getResolvedAt() != null && c.getResolvedAt().isAfter(startOfToday))
                .count();

        double avgRisk = assessments.stream().mapToInt(RiskAssessment::getRiskScore).average().orElse(0);

        return DashboardSummaryResponse.builder()
                .totalComplaints(total)
                .criticalIssues(critical)
                .pendingApprovals(pendingApprovals)
                .resolvedToday(resolvedToday)
                .averageRisk(Math.round(avgRisk * 10.0) / 10.0)
                .infrastructureHealth(infrastructureService.getAll())
                .build();
    }
}
