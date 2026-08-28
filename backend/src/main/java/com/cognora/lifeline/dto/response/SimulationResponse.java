package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.SimulationResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResponse {
    private UUID id;
    private UUID actionId;
    private String actionName;
    private String currentState;
    private String proposedAction;
    private String expectedImpact;
    private int affectedStudents;
    private String estimatedRecovery;
    private int failureProbabilityPercent;
    private boolean rollbackAvailable;
    private SimulationResult predictedResult;
    private Instant runAt;
}
