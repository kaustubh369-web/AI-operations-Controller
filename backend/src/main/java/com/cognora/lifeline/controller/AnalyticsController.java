package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.response.AnalyticsResponse;
import com.cognora.lifeline.dto.response.DashboardSummaryResponse;
import com.cognora.lifeline.service.AnalyticsService;
import com.cognora.lifeline.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Operations-center dashboard summary & chart data. Warden/Admin only.")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> summary() {
        return ResponseEntity.ok(dashboardService.buildSummary());
    }

    @GetMapping("/charts")
    public ResponseEntity<AnalyticsResponse> charts() {
        return ResponseEntity.ok(analyticsService.buildAnalytics());
    }
}
