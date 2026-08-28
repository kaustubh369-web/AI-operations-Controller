package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByComplaintIdOrderByTimestampAsc(UUID complaintId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
