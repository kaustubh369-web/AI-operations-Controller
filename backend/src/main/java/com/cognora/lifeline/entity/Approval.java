package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approvals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Approval {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private RecommendedAction action;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_for")
    private User decidedBy;

    @Column(length = 500)
    private String comment;

    @Builder.Default
    private Instant requestedAt = Instant.now();

    private Instant decidedAt;
}
