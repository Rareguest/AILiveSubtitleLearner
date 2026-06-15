package com.language.agent.repository;

import com.language.agent.entity.StudyStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudyStatsRepository extends JpaRepository<StudyStats, Long> {

    Optional<StudyStats> findByUserIdAndDate(Long userId, LocalDate date);

    List<StudyStats> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
