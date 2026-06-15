package com.language.agent.repository;

import com.language.agent.entity.Sentence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SentenceRepository extends JpaRepository<Sentence, Long> {

    Page<Sentence> findByUserId(Long userId, Pageable pageable);

    List<Sentence> findByUserIdAndFavoriteTrue(Long userId);

    Page<Sentence> findByUserIdAndFavoriteTrue(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    Page<Sentence> findByUserIdAndSourceTextContainingOrTranslatedTextContaining(Long userId, String sourceKeyword, String targetKeyword, Pageable pageable);

    List<Sentence> findByUserId(Long userId);
}
