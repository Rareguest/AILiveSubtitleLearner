package com.language.agent.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewResultDTO {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Item type is required")
    private String itemType;

    @NotNull(message = "Quality is required")
    @Min(value = 0, message = "Quality must be between 0 and 5")
    @Max(value = 5, message = "Quality must be between 0 and 5")
    private Integer quality;
}
