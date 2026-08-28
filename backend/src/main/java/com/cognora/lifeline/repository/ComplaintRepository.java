package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.ComplaintStatus;
import com.cognora.lifeline.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findByReportedByOrderByCreatedAtDesc(User reportedBy);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);
    long countByStatus(ComplaintStatus status);
}
