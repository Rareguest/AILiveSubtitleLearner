package com.language.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SentenceCreateRequest {

    @NotBlank(message = "Source text is required")
    private String sourceText;

    private String sourceLang;

    private String translatedText;

    private String targetLang;

    private String aiKnowledge;

    private String context;

    private String videoUrl;

    private Float timestamp;
}
