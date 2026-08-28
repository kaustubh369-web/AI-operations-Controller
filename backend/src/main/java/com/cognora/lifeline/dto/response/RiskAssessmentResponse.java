package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.RiskLevel;
import com.cognora.lifeline.entity.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessmentResponse {
    private Severity severity;
    private int confidencePercent;
    private int riskScore;
    private RiskLevel riskLevel;
    private String probableRootCause;
    private String explanation;
    private int impactScore;
    private int probabilityScore;
    private int affectedStudentsEstimate;
    private int safetyRiskScore;
    private int reversibilityScore;
    private boolean telemetryDegraded;
    private String telemetryNote;
}
