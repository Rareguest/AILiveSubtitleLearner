package com.language.agent.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sentences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String sourceText;

    @Column(length = 10)
    private String sourceLang;

    @Column(columnDefinition = "TEXT")
    private String translatedText;

    @Column(length = 10)
    private String targetLang;

    @Column(columnDefinition = "TEXT")
    private String aiKnowledge;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(length = 500)
    private String videoUrl;

    private Float timestamp;

    @Column(nullable = false)
    @Builder.Default
    private Boolean favorite = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer masteryLevel = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
