package com.language.agent.repository;

import com.language.agent.entity.Word;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<Word, Long> {

    Page<Word> findByUserId(Long userId, Pageable pageable);

    List<Word> findByUserIdAndFavoriteTrue(Long userId);

    Page<Word> findByUserIdAndFavoriteTrue(Long userId, Pageable pageable);

    Optional<Word> findByUserIdAndWord(Long userId, String word);

    long countByUserId(Long userId);

    long countByUserIdAndMasteryLevel(Long userId, Integer masteryLevel);

    Page<Word> findByUserIdAndMasteryLevel(Long userId, Integer masteryLevel, Pageable pageable);

    Page<Word> findByUserIdAndWordContainingOrDefinitionContaining(Long userId, String wordKeyword, String defKeyword, Pageable pageable);

    List<Word> findByUserId(Long userId);
}
