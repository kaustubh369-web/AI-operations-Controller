package com.cognora.lifeline.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalDecisionRequest {

    @NotNull
    private boolean approve;

    private String comment;
}
