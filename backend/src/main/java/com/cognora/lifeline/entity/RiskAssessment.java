package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false, unique = true)
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    private int confidencePercent;

    private int riskScore;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Column(length = 500)
    private String probableRootCause;

    @Column(length = 2000)
    private String explanation;

    // risk sub-factors, 0-100 each
    private int impactScore;
    private int probabilityScore;
    private int affectedStudentsEstimate;
    private int safetyRiskScore;
    private int reversibilityScore;

    private boolean telemetryDegraded;
    @Column(length = 500)
    private String telemetryNote;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
