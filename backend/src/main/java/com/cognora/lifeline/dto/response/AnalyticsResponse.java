package com.cognora.lifeline.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private Map<String, Long> complaintsByCategory;
    private Map<String, Long> complaintsByStatus;
    private Map<String, Long> riskDistribution;
    private List<TimeSeriesPoint> complaintsOverTime;
    private Map<String, Double> avgResolutionHoursByCategory;
    private List<LocationHotspot> mostProblematicLocations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesPoint {
        private String date;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationHotspot {
        private String location;
        private long count;
    }
}
