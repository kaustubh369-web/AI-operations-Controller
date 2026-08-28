package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.Notification;
import com.cognora.lifeline.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    long countByRecipientAndReadFalse(User recipient);
}
