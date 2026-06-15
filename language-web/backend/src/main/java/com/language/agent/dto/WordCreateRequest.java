package com.language.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WordCreateRequest {

    @NotBlank(message = "Word is required")
    private String word;

    private String phonetic;

    private String lang;

    private String definition;

    private String examples;

    private String notes;
}
