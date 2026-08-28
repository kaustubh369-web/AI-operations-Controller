package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    private ActorType actorType;

    private String actorName;

    @Column(nullable = false)
    private String event;

    @Column(length = 2000)
    private String details;

    private String riskSnapshot;

    private String actionSnapshot;

    private String resultSnapshot;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
