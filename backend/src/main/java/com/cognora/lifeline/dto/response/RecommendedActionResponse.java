package com.cognora.lifeline.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedActionResponse {
    private UUID id;
    private String actionName;
    private String description;
    private int riskScore;
    private int rank;
    private String estimatedRecoveryTime;
    private boolean reversible;
    private boolean isChosen;
}
