package com.language.agent.service.impl;

import com.language.agent.dto.DashboardStatsDTO;
import com.language.agent.entity.StudyStats;
import com.language.agent.repository.StudyStatsRepository;
import com.language.agent.repository.WordRepository;
import com.language.agent.repository.SentenceRepository;
import com.language.agent.service.ReviewService;
import com.language.agent.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final StudyStatsRepository studyStatsRepository;
    private final WordRepository wordRepository;
    private final SentenceRepository sentenceRepository;
    private final ReviewService reviewService;

    @Override
    public DashboardStatsDTO getDashboardStats(Long userId) {
        long totalWords = wordRepository.countByUserId(userId);
        long totalSentences = sentenceRepository.countByUserId(userId);
        long wordsDueReview = reviewService.getDueWordCount(userId);
        long sentencesDueReview = reviewService.getDueSentenceCount(userId);

        StudyStats todayStats = studyStatsRepository.findByUserIdAndDate(userId, LocalDate.now())
                .orElse(StudyStats.builder().wordsAdded(0).sentencesAdded(0).wordsReviewed(0).sentencesReviewed(0).studyMinutes(0).build());
        int todayStudied = todayStats.getWordsReviewed() + todayStats.getSentencesReviewed();

        int streak = calculateStreak(userId);

        return DashboardStatsDTO.builder()
                .totalWords(totalWords)
                .totalSentences(totalSentences)
                .wordsDueReview(wordsDueReview)
                .sentencesDueReview(sentencesDueReview)
                .todayStudied(todayStudied)
                .streak(streak)
                .build();
    }

    @Override
    public void recordStudy(Long userId, String type, int minutes) {
        LocalDate today = LocalDate.now();
        StudyStats stats = studyStatsRepository.findByUserIdAndDate(userId, today)
                .orElse(StudyStats.builder()
                        .userId(userId)
                        .date(today)
                        .wordsAdded(0)
                        .sentencesAdded(0)
                        .wordsReviewed(0)
                        .sentencesReviewed(0)
                        .studyMinutes(0)
                        .build());

        switch (type.toUpperCase()) {
            case "WORD_ADDED" -> stats.setWordsAdded(stats.getWordsAdded() + 1);
            case "SENTENCE_ADDED" -> stats.setSentencesAdded(stats.getSentencesAdded() + 1);
            case "WORD_REVIEWED" -> stats.setWordsReviewed(stats.getWordsReviewed() + 1);
            case "SENTENCE_REVIEWED" -> stats.setSentencesReviewed(stats.getSentencesReviewed() + 1);
        }
        stats.setStudyMinutes(stats.getStudyMinutes() + minutes);

        studyStatsRepository.save(stats);
    }

    @Override
    public List<StudyStats> getWeeklyStats(Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        return studyStatsRepository.findByUserIdAndDateBetween(userId, start, end);
    }

    private int calculateStreak(Long userId) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        while (true) {
            boolean studied = studyStatsRepository.findByUserIdAndDate(userId, date)
                    .map(stats -> stats.getStudyMinutes() > 0)
                    .orElse(false);
            if (studied) {
                streak++;
                date = date.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }
}
