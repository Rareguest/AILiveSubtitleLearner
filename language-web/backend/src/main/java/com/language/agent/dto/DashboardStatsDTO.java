package com.language.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {

    private Long totalWords;
    private Long totalSentences;
    private Long wordsDueReview;
    private Long sentencesDueReview;
    private Integer todayStudied;
    private Integer streak;
}
