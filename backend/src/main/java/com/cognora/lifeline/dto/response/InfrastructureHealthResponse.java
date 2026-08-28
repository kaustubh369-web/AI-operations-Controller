package com.cognora.lifeline.dto.response;

import com.cognora.lifeline.entity.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfrastructureHealthResponse {
    private String name;
    private int healthPercent;
    private AssetStatus status;
    private String hostelBlock;
}
