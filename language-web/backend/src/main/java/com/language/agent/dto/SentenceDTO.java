package com.language.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SentenceDTO {

    private Long id;
    private String sourceText;
    private String sourceLang;
    private String translatedText;
    private String targetLang;
    private String aiKnowledge;
    private String context;
    private String videoUrl;
    private Float timestamp;
    private Boolean favorite;
    private Integer reviewCount;
    private Integer masteryLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
