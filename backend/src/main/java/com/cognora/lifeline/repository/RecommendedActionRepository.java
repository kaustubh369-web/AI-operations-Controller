package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.RecommendedAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecommendedActionRepository extends JpaRepository<RecommendedAction, UUID> {
    List<RecommendedAction> findByComplaintOrderByRankAsc(Complaint complaint);
    List<RecommendedAction> findByComplaintIdOrderByRankAsc(UUID complaintId);
}
