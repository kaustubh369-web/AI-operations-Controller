package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recommended_actions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedAction {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    private String actionName;

    @Column(length = 1000)
    private String description;

    private int riskScore;

    private int rank; // 1 = safest / recommended first

    private String estimatedRecoveryTime;

    private boolean reversible;

    @Builder.Default
    private boolean isChosen = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
