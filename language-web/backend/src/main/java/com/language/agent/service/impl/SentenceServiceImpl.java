package com.language.agent.service.impl;

import com.language.agent.dto.PageResult;
import com.language.agent.dto.SentenceCreateRequest;
import com.language.agent.dto.SentenceDTO;
import com.language.agent.entity.Sentence;
import com.language.agent.exception.BusinessException;
import com.language.agent.repository.SentenceRepository;
import com.language.agent.service.AIService;
import com.language.agent.service.SentenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SentenceServiceImpl implements SentenceService {

    private final SentenceRepository sentenceRepository;
    private final AIService aiService;

    @Override
    public SentenceDTO create(Long userId, SentenceCreateRequest request) {
        Sentence sentence = Sentence.builder()
                .userId(userId)
                .sourceText(request.getSourceText())
                .sourceLang(request.getSourceLang())
                .translatedText(request.getTranslatedText())
                .targetLang(request.getTargetLang())
                .aiKnowledge(request.getAiKnowledge())
                .context(request.getContext())
                .videoUrl(request.getVideoUrl())
                .timestamp(request.getTimestamp())
                .favorite(false)
                .reviewCount(0)
                .masteryLevel(0)
                .build();
        return toDTO(sentenceRepository.save(sentence));
    }

    @Override
    public SentenceDTO update(Long userId, Long id, SentenceCreateRequest request) {
        Sentence sentence = sentenceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Sentence not found"));
        if (!sentence.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        sentence.setSourceText(request.getSourceText());
        sentence.setSourceLang(request.getSourceLang());
        sentence.setTranslatedText(request.getTranslatedText());
        sentence.setTargetLang(request.getTargetLang());
        sentence.setAiKnowledge(request.getAiKnowledge());
        sentence.setContext(request.getContext());
        sentence.setVideoUrl(request.getVideoUrl());
        sentence.setTimestamp(request.getTimestamp());
        return toDTO(sentenceRepository.save(sentence));
    }

    @Override
    public void delete(Long userId, Long id) {
        Sentence sentence = sentenceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Sentence not found"));
        if (!sentence.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        sentenceRepository.delete(sentence);
    }

    @Override
    public SentenceDTO getById(Long userId, Long id) {
        Sentence sentence = sentenceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Sentence not found"));
        if (!sentence.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        return toDTO(sentence);
    }

    @Override
    public PageResult<SentenceDTO> getByUserId(Long userId, int page, int size) {
        Page<Sentence> pageResult = sentenceRepository.findByUserId(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return toPageResult(pageResult);
    }

    @Override
    public List<SentenceDTO> getFavorites(Long userId) {
        return sentenceRepository.findByUserIdAndFavoriteTrue(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SentenceDTO toggleFavorite(Long userId, Long id) {
        Sentence sentence = sentenceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Sentence not found"));
        if (!sentence.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        sentence.setFavorite(!sentence.getFavorite());
        return toDTO(sentenceRepository.save(sentence));
    }

    @Override
    public PageResult<SentenceDTO> search(Long userId, String keyword, int page, int size) {
        Page<Sentence> pageResult = sentenceRepository.findByUserIdAndSourceTextContainingOrTranslatedTextContaining(
                userId, keyword, keyword,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return toPageResult(pageResult);
    }

    @Override
    public SentenceDTO generateKnowledge(Long userId, Long id) {
        Sentence sentence = sentenceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Sentence not found"));
        if (!sentence.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        String knowledge = aiService.generateKnowledgePoint(
                sentence.getSourceText() + " -> " + sentence.getTranslatedText(),
                sentence.getSourceLang() != null ? sentence.getSourceLang() : "en");
        sentence.setAiKnowledge(knowledge);
        return toDTO(sentenceRepository.save(sentence));
    }

    private SentenceDTO toDTO(Sentence sentence) {
        return SentenceDTO.builder()
                .id(sentence.getId())
                .sourceText(sentence.getSourceText())
                .sourceLang(sentence.getSourceLang())
                .translatedText(sentence.getTranslatedText())
                .targetLang(sentence.getTargetLang())
                .aiKnowledge(sentence.getAiKnowledge())
                .context(sentence.getContext())
                .videoUrl(sentence.getVideoUrl())
                .timestamp(sentence.getTimestamp())
                .favorite(sentence.getFavorite())
                .reviewCount(sentence.getReviewCount())
                .masteryLevel(sentence.getMasteryLevel())
                .createdAt(sentence.getCreatedAt())
                .updatedAt(sentence.getUpdatedAt())
                .build();
    }

    private PageResult<SentenceDTO> toPageResult(Page<Sentence> page) {
        return new PageResult<>(
                page.getContent().stream().map(this::toDTO).collect(Collectors.toList()),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize());
    }
}
