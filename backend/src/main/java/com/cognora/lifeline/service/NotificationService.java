package com.cognora.lifeline.service;

import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.Notification;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notify(User recipient, Complaint complaint, String title, String message) {
        if (recipient == null) return;
        Notification notification = Notification.builder()
                .recipient(recipient)
                .complaint(complaint)
                .title(title)
                .message(message)
                .build();
        notificationRepository.save(notification);
    }
}
