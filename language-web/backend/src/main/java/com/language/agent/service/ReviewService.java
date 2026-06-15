package com.language.agent.service;

import com.language.agent.dto.ReviewResultDTO;
import com.language.agent.entity.ReviewRecord;

import java.util.List;

public interface ReviewService {

    ReviewRecord submitReview(Long userId, ReviewResultDTO result);

    List<ReviewRecord> getDueItems(Long userId);

    long getDueCount(Long userId);

    long getDueWordCount(Long userId);

    long getDueSentenceCount(Long userId);
}
