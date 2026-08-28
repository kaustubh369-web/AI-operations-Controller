package com.cognora.lifeline.controller;

import com.cognora.lifeline.entity.Notification;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Per-user notification feed")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationRepository.findByRecipientOrderByCreatedAtDesc(user));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipient().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.noContent().build();
    }
}
