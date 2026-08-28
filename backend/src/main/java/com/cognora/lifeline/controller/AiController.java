package com.cognora.lifeline.controller;

import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.service.ComplaintService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "Re-run / inspect the deterministic AI analysis pipeline")
public class AiController {

    private final ComplaintService complaintService;

    /** Re-runs the AI pipeline for a complaint (e.g. after new telemetry). Warden/Admin only. */
    @PostMapping("/reanalyze/{complaintId}")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<?> reanalyze(@AuthenticationPrincipal User user, @PathVariable UUID complaintId) {
        var complaint = complaintService.requireComplaint(complaintId);
        complaintService.runAiPipeline(complaint);
        return ResponseEntity.ok(Map.of("message", "Re-analysis complete", "complaintId", complaintId));
    }
}
