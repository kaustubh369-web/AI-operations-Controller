package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.response.ComplaintResponse;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.service.ComplaintService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@Tag(name = "Risk", description = "Risk assessment lookups")
public class RiskController {

    private final ComplaintService complaintService;

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<?> getRisk(@AuthenticationPrincipal User user, @PathVariable UUID complaintId) {
        ComplaintResponse response = complaintService.getComplaint(complaintId, user);
        return ResponseEntity.ok(response.getRiskAssessment());
    }
}
