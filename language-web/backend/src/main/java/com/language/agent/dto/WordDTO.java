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
public class WordDTO {

    private Long id;
    private String word;
    private String phonetic;
    private String lang;
    private String definition;
    private String examples;
    private String notes;
    private String aiKnowledge;
    private Boolean favorite;
    private Integer reviewCount;
    private Integer masteryLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
