package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.AnalyticsResponse;
import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.ComplaintStatus;
import com.cognora.lifeline.entity.RiskAssessment;
import com.cognora.lifeline.repository.ComplaintRepository;
import com.cognora.lifeline.repository.RiskAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public AnalyticsResponse buildAnalytics() {
        List<Complaint> complaints = complaintRepository.findAll();
        List<RiskAssessment> assessments = riskAssessmentRepository.findAll();

        Map<String, Long> byCategory = complaints.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory().name(), Collectors.counting()));

        Map<String, Long> byStatus = complaints.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus().name(), Collectors.counting()));

        Map<String, Long> riskDistribution = assessments.stream()
                .collect(Collectors.groupingBy(r -> r.getRiskLevel().name(), Collectors.counting()));

        // last 14 days
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<String, Long> dayCounts = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) {
            dayCounts.put(today.minusDays(i).format(DAY_FMT), 0L);
        }
        for (Complaint c : complaints) {
            String day = LocalDate.ofInstant(c.getCreatedAt(), ZoneOffset.UTC).format(DAY_FMT);
            if (dayCounts.containsKey(day)) {
                dayCounts.put(day, dayCounts.get(day) + 1);
            }
        }
        List<AnalyticsResponse.TimeSeriesPoint> overTime = dayCounts.entrySet().stream()
                .map(e -> AnalyticsResponse.TimeSeriesPoint.builder().date(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        Map<String, List<Complaint>> resolvedByCategory = complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getResolvedAt() != null)
                .collect(Collectors.groupingBy(c -> c.getCategory().name()));

        Map<String, Double> avgResolutionHours = new HashMap<>();
        resolvedByCategory.forEach((cat, list) -> {
            double avg = list.stream()
                    .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getResolvedAt()).toMinutes())
                    .average().orElse(0) / 60.0;
            avgResolutionHours.put(cat, Math.round(avg * 100.0) / 100.0);
        });

        Map<String, Long> byLocation = complaints.stream()
                .filter(c -> c.getHostelBlock() != null)
                .collect(Collectors.groupingBy(Complaint::getHostelBlock, Collectors.counting()));

        List<AnalyticsResponse.LocationHotspot> hotspots = byLocation.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> AnalyticsResponse.LocationHotspot.builder().location(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .complaintsByCategory(byCategory)
                .complaintsByStatus(byStatus)
                .riskDistribution(riskDistribution)
                .complaintsOverTime(overTime)
                .avgResolutionHoursByCategory(avgResolutionHours)
                .mostProblematicLocations(hotspots)
                .build();
    }
}
