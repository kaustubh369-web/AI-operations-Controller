package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.ApprovalResponse;
import com.cognora.lifeline.entity.*;
import com.cognora.lifeline.exception.BadRequestException;
import com.cognora.lifeline.exception.ResourceNotFoundException;
import com.cognora.lifeline.repository.ApprovalRepository;
import com.cognora.lifeline.repository.ComplaintRepository;
import com.cognora.lifeline.repository.RecommendedActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRepository approvalRepository;
    private final ComplaintRepository complaintRepository;
    private final RecommendedActionRepository recommendedActionRepository;
    private final SimulationService simulationService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public List<ApprovalResponse> listPending() {
        return approvalRepository.findByStatusOrderByRequestedAtDesc(ApprovalStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ApprovalResponse> listForComplaint(UUID complaintId) {
        return approvalRepository.findByComplaintIdOrderByRequestedAtDesc(complaintId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ApprovalResponse decide(UUID approvalId, User warden, boolean approve, String comment) {
        Approval approval = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new ResourceNotFoundException("Approval request not found: " + approvalId));

        if (approval.getStatus() != ApprovalStatus.PENDING) {
            throw new BadRequestException("This approval has already been decided");
        }

        Complaint complaint = approval.getComplaint();
        RecommendedAction action = approval.getAction();

        approval.setStatus(approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        approval.setDecidedBy(warden);
        approval.setComment(comment);
        approval.setDecidedAt(Instant.now());
        approvalRepository.save(approval);

        ActorType actorType = warden.getRole() == Role.ADMIN ? ActorType.ADMIN : ActorType.WARDEN;

        auditService.log(complaint, actorType, warden.getFullName(),
                approve ? "Action Approved" : "Action Rejected",
                (comment == null || comment.isBlank()) ? "No comment provided." : comment,
                null, action.getActionName(), null);

        if (approve) {
            complaint.setStatus(ComplaintStatus.ACTION_APPROVED);
            complaintRepository.save(complaint);

            simulationService.runSimulation(complaint, action, 0);

            action.setChosen(true);
            recommendedActionRepository.save(action);

            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
            complaintRepository.save(complaint);
            auditService.log(complaint, ActorType.SYSTEM, "LifeLine System", "Action Executed",
                    "Warden-approved action executed in simulation.", null, action.getActionName(), "SIMULATED_EXECUTION");

            complaint.setStatus(ComplaintStatus.RESOLVED);
            complaint.setResolvedAt(Instant.now());
            complaintRepository.save(complaint);
            auditService.log(complaint, ActorType.SYSTEM, "LifeLine System", "Incident Resolved",
                    "Resolved after approved action was executed.");

            notificationService.notify(complaint.getReportedBy(), complaint,
                    "Your complaint has been resolved",
                    "\"" + complaint.getTitle() + "\" was resolved via: " + action.getActionName());
        } else {
            complaint.setStatus(ComplaintStatus.UNDER_REVIEW);
            complaintRepository.save(complaint);
            notificationService.notify(complaint.getReportedBy(), complaint,
                    "Update on your complaint",
                    "The warden is reviewing alternative options for \"" + complaint.getTitle() + "\".");
        }

        return toResponse(approval);
    }

    private ApprovalResponse toResponse(Approval a) {
        return ApprovalResponse.builder()
                .id(a.getId())
                .complaintId(a.getComplaint().getId())
                .complaintTitle(a.getComplaint().getTitle())
                .actionId(a.getAction().getId())
                .actionName(a.getAction().getActionName())
                .riskScore(a.getAction().getRiskScore())
                .status(a.getStatus())
                .decidedByName(a.getDecidedBy() != null ? a.getDecidedBy().getFullName() : null)
                .comment(a.getComment())
                .requestedAt(a.getRequestedAt())
                .decidedAt(a.getDecidedAt())
                .build();
    }
}
