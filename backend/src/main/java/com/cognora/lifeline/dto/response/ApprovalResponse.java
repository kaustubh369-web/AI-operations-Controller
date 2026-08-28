package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.ApprovalStatus;
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
public class ApprovalResponse {
    private UUID id;
    private UUID complaintId;
    private String complaintTitle;
    private UUID actionId;
    private String actionName;
    private int riskScore;
    private ApprovalStatus status;
    private String decidedByName;
    private String comment;
    private Instant requestedAt;
    private Instant decidedAt;
}
