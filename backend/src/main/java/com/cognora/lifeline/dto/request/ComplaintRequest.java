package com.cognora.lifeline.dto.request;

import com.cognora.lifeline.entity.ComplaintCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComplaintRequest {

    @NotNull
    private ComplaintCategory category;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String hostelBlock;

    private String floor;
    private String room;
    private String imageUrl;
}
