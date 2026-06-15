package com.language.agent.service.impl;

import com.language.agent.dto.ReviewResultDTO;
import com.language.agent.entity.ItemType;
import com.language.agent.entity.ReviewRecord;
import com.language.agent.entity.Word;
import com.language.agent.entity.Sentence;
import com.language.agent.exception.BusinessException;
import com.language.agent.repository.ReviewRecordRepository;
import com.language.agent.repository.WordRepository;
import com.language.agent.repository.SentenceRepository;
import com.language.agent.service.ReviewService;
import com.language.agent.util.Sm2Algorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRecordRepository reviewRecordRepository;
    private final WordRepository wordRepository;
    private final SentenceRepository sentenceRepository;

    @Override
    public ReviewRecord submitReview(Long userId, ReviewResultDTO result) {
        ItemType itemType = ItemType.valueOf(result.getItemType());

        ReviewRecord record = reviewRecordRepository
                .findByUserIdAndItemIdAndItemType(userId, result.getItemId(), itemType)
                .orElse(ReviewRecord.builder()
                        .userId(userId)
                        .itemId(result.getItemId())
                        .itemType(itemType)
                        .interval(1)
                        .easeFactor(2.5f)
                        .reviewCount(0)
                        .nextReviewAt(LocalDateTime.now())
                        .build());

        Sm2Algorithm.Sm2Result sm2Result = Sm2Algorithm.calculate(
                result.getQuality(), record.getInterval(), record.getEaseFactor());

        record.setInterval(sm2Result.getInterval());
        record.setEaseFactor(sm2Result.getEaseFactor());
        record.setReviewCount(record.getReviewCount() + 1);
        record.setNextReviewAt(LocalDateTime.now().plusDays(sm2Result.getInterval()));

        updateMasteryLevel(userId, result.getItemId(), itemType, result.getQuality());

        return reviewRecordRepository.save(record);
    }

    @Override
    public List<ReviewRecord> getDueItems(Long userId) {
        return reviewRecordRepository.findByUserIdAndNextReviewAtBefore(userId, LocalDateTime.now());
    }

    @Override
    public long getDueCount(Long userId) {
        return reviewRecordRepository.countByUserIdAndNextReviewAtBefore(userId, LocalDateTime.now());
    }

    @Override
    public long getDueWordCount(Long userId) {
        return reviewRecordRepository.countByUserIdAndItemTypeAndNextReviewAtBefore(
                userId, ItemType.WORD, LocalDateTime.now());
    }

    @Override
    public long getDueSentenceCount(Long userId) {
        return reviewRecordRepository.countByUserIdAndItemTypeAndNextReviewAtBefore(
                userId, ItemType.SENTENCE, LocalDateTime.now());
    }

    private void updateMasteryLevel(Long userId, Long itemId, ItemType itemType, int quality) {
        int masteryLevel = Math.min(5, quality);
        if (itemType == ItemType.WORD) {
            wordRepository.findById(itemId).ifPresent(word -> {
                if (word.getUserId().equals(userId)) {
                    word.setMasteryLevel(masteryLevel);
                    word.setReviewCount(word.getReviewCount() + 1);
                    wordRepository.save(word);
                }
            });
        } else {
            sentenceRepository.findById(itemId).ifPresent(sentence -> {
                if (sentence.getUserId().equals(userId)) {
                    sentence.setMasteryLevel(masteryLevel);
                    sentence.setReviewCount(sentence.getReviewCount() + 1);
                    sentenceRepository.save(sentence);
                }
            });
        }
    }
}
