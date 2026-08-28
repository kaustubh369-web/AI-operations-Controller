package com.cognora.lifeline.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "complaints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategory category;

    @NotBlank
    private String title;

    @Column(length = 2000, nullable = false)
    private String description;

    private String hostelBlock;
    private String floor;
    private String room;
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.SUBMITTED;

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant updatedAt;
    private Instant resolvedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
