package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.request.ComplaintRequest;
import com.cognora.lifeline.dto.response.*;
import com.cognora.lifeline.entity.*;
import com.cognora.lifeline.exception.ForbiddenActionException;
import com.cognora.lifeline.exception.ResourceNotFoundException;
import com.cognora.lifeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RecommendedActionRepository recommendedActionRepository;
    private final ApprovalRepository approvalRepository;
    private final UserRepository userRepository;

    private final AiAnalysisService aiAnalysisService;
    private final RiskEngineService riskEngineService;
    private final SimulationService simulationService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public ComplaintResponse submitComplaint(User student, ComplaintRequest request) {
        Complaint complaint = Complaint.builder()
                .reportedBy(student)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .hostelBlock(request.getHostelBlock())
                .floor(request.getFloor())
                .room(request.getRoom())
                .imageUrl(request.getImageUrl())
                .status(ComplaintStatus.SUBMITTED)
                .build();
        complaintRepository.save(complaint);

        auditService.log(complaint, ActorType.STUDENT, student.getFullName(), "Complaint Created",
                "\"" + request.getTitle() + "\" reported in " + request.getHostelBlock());

        runAiPipeline(complaint);

        return toResponse(complaintRepository.findById(complaint.getId()).orElseThrow());
    }

    /** AI analysis → risk assessment → ranked actions → auto-resolve (LOW) or route for approval (MEDIUM+). */
    @Transactional
    public void runAiPipeline(Complaint complaint) {
        AiAnalysisService.AnalysisResult result = aiAnalysisService.analyze(
                complaint.getCategory(), complaint.getTitle(), complaint.getDescription(), complaint.getHostelBlock());

        int riskScore = riskEngineService.calculateRiskScore(
                result.impactScore(), result.probabilityScore(), result.affectedStudentsEstimate(),
                result.safetyRiskScore(), result.reversibilityScore());
        RiskLevel riskLevel = riskEngineService.levelFor(riskScore);

        RiskAssessment assessment = RiskAssessment.builder()
                .complaint(complaint)
                .severity(result.severity())
                .confidencePercent(result.confidencePercent())
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .probableRootCause(result.probableRootCause())
                .explanation(result.explanation())
                .impactScore(result.impactScore())
                .probabilityScore(result.probabilityScore())
                .affectedStudentsEstimate(result.affectedStudentsEstimate())
                .safetyRiskScore(result.safetyRiskScore())
                .reversibilityScore(result.reversibilityScore())
                .telemetryDegraded(result.telemetryDegraded())
                .telemetryNote(result.telemetryNote())
                .build();
        riskAssessmentRepository.save(assessment);

        complaint.setStatus(ComplaintStatus.AI_ANALYZED);
        complaintRepository.save(complaint);

        auditService.log(complaint, ActorType.AI, "LifeLine AI", "AI Analysis Completed",
                result.probableRootCause() + " (confidence " + result.confidencePercent() + "%)"
                        + (result.telemetryDegraded() ? " — " + result.telemetryNote() : ""));

        auditService.log(complaint, ActorType.AI, "LifeLine AI", "Risk Assessed",
                result.explanation(), riskLevel + " (" + riskScore + "/100)", null, null);

        List<RecommendedAction> actions = result.candidateActions().stream()
                .sorted(Comparator.comparingInt(AiAnalysisService.ActionTemplate::riskScore))
                .toList();

        RecommendedAction topAction = null;
        int rank = 1;
        for (AiAnalysisService.ActionTemplate t : actions) {
            RecommendedAction action = RecommendedAction.builder()
                    .complaint(complaint)
                    .actionName(t.name())
                    .description(t.description())
                    .riskScore(t.riskScore())
                    .rank(rank)
                    .estimatedRecoveryTime(t.estimatedRecoveryTime())
                    .reversible(t.reversible())
                    .build();
            recommendedActionRepository.save(action);
            if (rank == 1) topAction = action;
            rank++;
        }

        if (topAction != null) {
            auditService.log(complaint, ActorType.AI, "LifeLine AI", "Action Recommended",
                    actions.size() + " recovery action(s) ranked by risk. Safest: \"" + topAction.getActionName() + "\".",
                    null, topAction.getActionName(), null);
        }

        complaint.setStatus(ComplaintStatus.UNDER_REVIEW);
        complaintRepository.save(complaint);

        if (topAction == null) return;

        if (riskLevel == RiskLevel.LOW) {
            autoResolveLowRisk(complaint, topAction, result.affectedStudentsEstimate());
        } else {
            requestApproval(complaint, topAction);
        }
    }

    private void autoResolveLowRisk(Complaint complaint, RecommendedAction action, int affectedHint) {
        simulationService.runSimulation(complaint, action, affectedHint);

        action.setChosen(true);
        recommendedActionRepository.save(action);

        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaintRepository.save(complaint);
        auditService.log(complaint, ActorType.SYSTEM, "LifeLine System", "Action Executed",
                "Low risk — auto-executed without warden approval per governance policy.",
                null, action.getActionName(), "SIMULATED_EXECUTION");

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(java.time.Instant.now());
        complaintRepository.save(complaint);
        auditService.log(complaint, ActorType.SYSTEM, "LifeLine System", "Incident Resolved",
                "Auto-resolved: low-risk action completed successfully.");

        notificationService.notify(complaint.getReportedBy(), complaint,
                "Your complaint was auto-resolved",
                "\"" + complaint.getTitle() + "\" was low-risk and resolved automatically: " + action.getActionName());
    }

    private void requestApproval(Complaint complaint, RecommendedAction action) {
        complaint.setStatus(ComplaintStatus.APPROVAL_REQUIRED);
        complaintRepository.save(complaint);

        Approval approval = Approval.builder()
                .complaint(complaint)
                .action(action)
                .status(ApprovalStatus.PENDING)
                .build();
        approvalRepository.save(approval);

        auditService.log(complaint, ActorType.SYSTEM, "LifeLine System", "Approval Requested",
                "Risk level requires warden sign-off before \"" + action.getActionName() + "\" can run.",
                null, action.getActionName(), null);
    }

    @Transactional
    public void escalate(UUID complaintId, User actor) {
        Complaint complaint = requireComplaint(complaintId);
        complaint.setStatus(ComplaintStatus.ESCALATED);
        complaintRepository.save(complaint);
        auditService.log(complaint, actor.getRole() == Role.ADMIN ? ActorType.ADMIN : ActorType.WARDEN,
                actor.getFullName(), "Incident Escalated", "Manually escalated for senior review.");
    }

    @Transactional
    public void markResolved(UUID complaintId, User actor) {
        Complaint complaint = requireComplaint(complaintId);
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(java.time.Instant.now());
        complaintRepository.save(complaint);
        auditService.log(complaint, actor.getRole() == Role.ADMIN ? ActorType.ADMIN : ActorType.WARDEN,
                actor.getFullName(), "Incident Resolved", "Manually marked resolved by staff.");
        notificationService.notify(complaint.getReportedBy(), complaint,
                "Your complaint has been resolved", "\"" + complaint.getTitle() + "\" is now marked resolved.");
    }

    public Complaint requireComplaint(UUID id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + id));
    }

    public ComplaintResponse getComplaint(UUID id, User requester) {
        Complaint complaint = requireComplaint(id);
        assertCanView(complaint, requester);
        return toResponse(complaint);
    }

    public List<ComplaintResponse> listForUser(User requester) {
        List<Complaint> complaints = requester.getRole() == Role.STUDENT
                ? complaintRepository.findByReportedByOrderByCreatedAtDesc(requester)
                : complaintRepository.findAllByOrderByCreatedAtDesc();
        return complaints.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private void assertCanView(Complaint complaint, User requester) {
        if (requester.getRole() == Role.STUDENT && !complaint.getReportedBy().getId().equals(requester.getId())) {
            throw new ForbiddenActionException("You can only view your own complaints");
        }
    }

    public ComplaintResponse toResponse(Complaint c) {
        RiskAssessmentResponse riskResponse = riskAssessmentRepository.findByComplaintId(c.getId())
                .map(r -> RiskAssessmentResponse.builder()
                        .severity(r.getSeverity())
                        .confidencePercent(r.getConfidencePercent())
                        .riskScore(r.getRiskScore())
                        .riskLevel(r.getRiskLevel())
                        .probableRootCause(r.getProbableRootCause())
                        .explanation(r.getExplanation())
                        .impactScore(r.getImpactScore())
                        .probabilityScore(r.getProbabilityScore())
                        .affectedStudentsEstimate(r.getAffectedStudentsEstimate())
                        .safetyRiskScore(r.getSafetyRiskScore())
                        .reversibilityScore(r.getReversibilityScore())
                        .telemetryDegraded(r.isTelemetryDegraded())
                        .telemetryNote(r.getTelemetryNote())
                        .build())
                .orElse(null);

        List<RecommendedActionResponse> actions = recommendedActionRepository.findByComplaintIdOrderByRankAsc(c.getId())
                .stream()
                .map(a -> RecommendedActionResponse.builder()
                        .id(a.getId())
                        .actionName(a.getActionName())
                        .description(a.getDescription())
                        .riskScore(a.getRiskScore())
                        .rank(a.getRank())
                        .estimatedRecoveryTime(a.getEstimatedRecoveryTime())
                        .reversible(a.isReversible())
                        .isChosen(a.isChosen())
                        .build())
                .collect(Collectors.toList());

        return ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .status(c.getStatus())
                .hostelBlock(c.getHostelBlock())
                .floor(c.getFloor())
                .room(c.getRoom())
                .imageUrl(c.getImageUrl())
                .reportedByName(c.getReportedBy().getFullName())
                .reportedById(c.getReportedBy().getId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .riskAssessment(riskResponse)
                .recommendedActions(actions)
                .build();
    }
}
