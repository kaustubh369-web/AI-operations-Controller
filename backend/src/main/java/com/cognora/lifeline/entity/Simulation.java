package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "simulations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Simulation {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private RecommendedAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(length = 500)
    private String currentState;

    @Column(length = 500)
    private String proposedAction;

    @Column(length = 1000)
    private String expectedImpact;

    private int affectedStudents;

    private String estimatedRecovery;

    private int failureProbabilityPercent;

    private boolean rollbackAvailable;

    @Enumerated(EnumType.STRING)
    private SimulationResult predictedResult;

    @Builder.Default
    private Instant runAt = Instant.now();
}
