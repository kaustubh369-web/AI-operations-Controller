package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.SimulationResponse;
import com.cognora.lifeline.entity.*;
import com.cognora.lifeline.exception.ResourceNotFoundException;
import com.cognora.lifeline.repository.RecommendedActionRepository;
import com.cognora.lifeline.repository.SimulationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Produces a predicted outcome for a recommended action BEFORE it is ever approved
 * or executed. Nothing here touches real infrastructure — see README "Simulation only" note.
 */
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final SimulationRepository simulationRepository;
    private final RecommendedActionRepository recommendedActionRepository;
    private final AuditService auditService;
    private final SecureRandom random = new SecureRandom();

    public Simulation runSimulation(Complaint complaint, RecommendedAction action, int affectedStudentsHint) {
        auditService.log(complaint, ActorType.AI, "LifeLine AI", "Simulation Started",
                "Simulating action \"" + action.getActionName() + "\" before any real execution.",
                null, action.getActionName(), null);

        int affected = affectedStudentsHint > 0 ? affectedStudentsHint : Math.max(1, action.getRiskScore() / 2);
        int failureProbability = clamp((int) Math.round(action.getRiskScore() * 0.12) + 2, 2, 35);

        int roll = random.nextInt(100);
        SimulationResult predicted;
        if (roll < failureProbability) {
            predicted = SimulationResult.FAILED;
        } else if (roll < failureProbability + 12) {
            predicted = SimulationResult.PARTIAL_SUCCESS;
        } else {
            predicted = SimulationResult.SUCCESSFUL;
        }

        Simulation simulation = Simulation.builder()
                .action(action)
                .complaint(complaint)
                .currentState("Complaint open: \"" + complaint.getTitle() + "\" at " + safeLocation(complaint))
                .proposedAction(action.getActionName() + " — " + action.getDescription())
                .expectedImpact(describeImpact(action, affected))
                .affectedStudents(affected)
                .estimatedRecovery(action.getEstimatedRecoveryTime())
                .failureProbabilityPercent(failureProbability)
                .rollbackAvailable(action.isReversible())
                .predictedResult(predicted)
                .build();

        simulationRepository.save(simulation);

        auditService.log(complaint, ActorType.AI, "LifeLine AI", "Simulation Completed",
                "Predicted result: " + predicted + " (failure probability " + failureProbability + "%).",
                null, action.getActionName(), predicted.name());

        return simulation;
    }

    private String describeImpact(RecommendedAction action, int affected) {
        return String.format("Approximately %d student(s) may be briefly affected while \"%s\" is carried out. Rollback is %s.",
                affected, action.getActionName(), action.isReversible() ? "available" : "NOT available");
    }

    private String safeLocation(Complaint c) {
        StringBuilder sb = new StringBuilder();
        if (c.getHostelBlock() != null) sb.append(c.getHostelBlock());
        if (c.getFloor() != null) sb.append(", ").append(c.getFloor());
        if (c.getRoom() != null) sb.append(", Room ").append(c.getRoom());
        return sb.toString();
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    public List<SimulationResponse> getForComplaint(UUID complaintId) {
        return simulationRepository.findByComplaintIdOrderByRunAtDesc(complaintId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public RecommendedAction requireAction(UUID actionId) {
        return recommendedActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommended action not found: " + actionId));
    }

    public SimulationResponse toResponse(Simulation s) {
        return SimulationResponse.builder()
                .id(s.getId())
                .actionId(s.getAction().getId())
                .actionName(s.getAction().getActionName())
                .currentState(s.getCurrentState())
                .proposedAction(s.getProposedAction())
                .expectedImpact(s.getExpectedImpact())
                .affectedStudents(s.getAffectedStudents())
                .estimatedRecovery(s.getEstimatedRecovery())
                .failureProbabilityPercent(s.getFailureProbabilityPercent())
                .rollbackAvailable(s.isRollbackAvailable())
                .predictedResult(s.getPredictedResult())
                .runAt(s.getRunAt())
                .build();
    }
}
