package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.Approval;
import com.cognora.lifeline.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    List<Approval> findByStatusOrderByRequestedAtDesc(ApprovalStatus status);
    List<Approval> findByComplaintIdOrderByRequestedAtDesc(UUID complaintId);
}
