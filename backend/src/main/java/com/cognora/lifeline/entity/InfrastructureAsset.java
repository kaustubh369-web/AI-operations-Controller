package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "infrastructure_assets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfrastructureAsset {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name; // e.g. "Wi-Fi", "AC", "Fire Safety"

    @Enumerated(EnumType.STRING)
    private ComplaintCategory category;

    private int healthPercent;

    @Enumerated(EnumType.STRING)
    private AssetStatus status;

    private String hostelBlock;

    @Builder.Default
    private Instant lastUpdated = Instant.now();
}
