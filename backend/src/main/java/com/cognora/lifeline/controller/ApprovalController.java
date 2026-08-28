package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.request.ApprovalDecisionRequest;
import com.cognora.lifeline.dto.response.ApprovalResponse;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.service.ApprovalService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@Tag(name = "Approvals", description = "Human-governance gate for MEDIUM+ risk actions. Warden/Admin only.")
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalResponse>> pending() {
        return ResponseEntity.ok(approvalService.listPending());
    }

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<ApprovalResponse>> forComplaint(@PathVariable UUID complaintId) {
        return ResponseEntity.ok(approvalService.listForComplaint(complaintId));
    }

    @PostMapping("/{approvalId}/decide")
    public ResponseEntity<ApprovalResponse> decide(@AuthenticationPrincipal User warden,
                                                     @PathVariable UUID approvalId,
                                                     @Valid @RequestBody ApprovalDecisionRequest request) {
        return ResponseEntity.ok(approvalService.decide(approvalId, warden, request.isApprove(), request.getComment()));
    }
}
