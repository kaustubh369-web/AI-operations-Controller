package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.ComplaintCategory;
import com.cognora.lifeline.entity.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private UUID id;
    private String title;
    private String description;
    private ComplaintCategory category;
    private ComplaintStatus status;
    private String hostelBlock;
    private String floor;
    private String room;
    private String imageUrl;

    private String reportedByName;
    private UUID reportedById;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;

    private RiskAssessmentResponse riskAssessment;
    private List<RecommendedActionResponse> recommendedActions;
}
