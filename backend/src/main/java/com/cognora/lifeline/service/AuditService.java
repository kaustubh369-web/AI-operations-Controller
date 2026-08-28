package com.cognora.lifeline.service;

import com.cognora.lifeline.entity.ActorType;
import com.cognora.lifeline.entity.AuditLog;
import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(Complaint complaint, ActorType actorType, String actorName, String event, String details) {
        log(complaint, actorType, actorName, event, details, null, null, null);
    }

    public void log(Complaint complaint, ActorType actorType, String actorName, String event, String details,
                     String riskSnapshot, String actionSnapshot, String resultSnapshot) {
        AuditLog entry = AuditLog.builder()
                .complaint(complaint)
                .actorType(actorType)
                .actorName(actorName)
                .event(event)
                .details(details)
                .riskSnapshot(riskSnapshot)
                .actionSnapshot(actionSnapshot)
                .resultSnapshot(resultSnapshot)
                .build();
        auditLogRepository.save(entry);
    }
}
