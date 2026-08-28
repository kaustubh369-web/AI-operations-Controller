package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.ActorType;
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
public class AuditLogResponse {
    private UUID id;
    private UUID complaintId;
    private ActorType actorType;
    private String actorName;
    private String event;
    private String details;
    private String riskSnapshot;
    private String actionSnapshot;
    private String resultSnapshot;
    private Instant timestamp;
}
