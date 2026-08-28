package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {
    Optional<RiskAssessment> findByComplaint(Complaint complaint);
    Optional<RiskAssessment> findByComplaintId(UUID complaintId);
}
