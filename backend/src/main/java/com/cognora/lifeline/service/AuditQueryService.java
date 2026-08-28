package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.AuditLogResponse;
import com.cognora.lifeline.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public List<AuditLogResponse> forComplaint(UUID complaintId) {
        return auditLogRepository.findByComplaintIdOrderByTimestampAsc(complaintId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AuditLogResponse> all() {
        return auditLogRepository.findAllByOrderByTimestampDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(com.cognora.lifeline.entity.AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .complaintId(log.getComplaint() != null ? log.getComplaint().getId() : null)
                .actorType(log.getActorType())
                .actorName(log.getActorName())
                .event(log.getEvent())
                .details(log.getDetails())
                .riskSnapshot(log.getRiskSnapshot())
                .actionSnapshot(log.getActionSnapshot())
                .resultSnapshot(log.getResultSnapshot())
                .timestamp(log.getTimestamp())
                .build();
    }
}
