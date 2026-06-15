package com.language.agent.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_stats", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    @Builder.Default
    private Integer wordsAdded = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer sentencesAdded = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer wordsReviewed = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer sentencesReviewed = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer studyMinutes = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
