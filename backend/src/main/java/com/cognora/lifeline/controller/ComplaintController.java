package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.request.ComplaintRequest;
import com.cognora.lifeline.dto.response.ComplaintResponse;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.service.ComplaintService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Report, view and track complaints. Submission triggers the full AI pipeline.")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<ComplaintResponse> submit(@AuthenticationPrincipal User user,
                                                      @Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.submitComplaint(user, request));
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.listForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> get(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getComplaint(id, user));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<Void> escalate(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        complaintService.escalate(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Void> resolve(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        complaintService.markResolved(id, user);
        return ResponseEntity.noContent().build();
    }
}
