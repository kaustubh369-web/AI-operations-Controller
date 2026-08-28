package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.response.AuditLogResponse;
import com.cognora.lifeline.service.AuditQueryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Immutable event trail for every complaint. Warden/Admin only.")
@PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
public class AuditController {

    private final AuditQueryService auditQueryService;

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<AuditLogResponse>> forComplaint(@PathVariable UUID complaintId) {
        return ResponseEntity.ok(auditQueryService.forComplaint(complaintId));
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> all() {
        return ResponseEntity.ok(auditQueryService.all());
    }
}
