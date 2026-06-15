package com.language.agent.repository;

import com.language.agent.entity.ItemType;
import com.language.agent.entity.ReviewRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRecordRepository extends JpaRepository<ReviewRecord, Long> {

    List<ReviewRecord> findByUserIdAndNextReviewAtBefore(Long userId, LocalDateTime now);

    long countByUserIdAndNextReviewAtBefore(Long userId, LocalDateTime now);

    Optional<ReviewRecord> findByUserIdAndItemIdAndItemType(Long userId, Long itemId, ItemType itemType);

    List<ReviewRecord> findByUserIdAndItemTypeAndNextReviewAtBefore(Long userId, ItemType itemType, LocalDateTime now);

    long countByUserIdAndItemTypeAndNextReviewAtBefore(Long userId, ItemType itemType, LocalDateTime now);

    long countByNextReviewAtBefore(LocalDateTime now);
}
