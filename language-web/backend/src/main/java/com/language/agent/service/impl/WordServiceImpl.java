package com.language.agent.service.impl;

import com.language.agent.dto.PageResult;
import com.language.agent.dto.WordCreateRequest;
import com.language.agent.dto.WordDTO;
import com.language.agent.entity.Word;
import com.language.agent.exception.BusinessException;
import com.language.agent.repository.WordRepository;
import com.language.agent.service.AIService;
import com.language.agent.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WordServiceImpl implements WordService {

    private final WordRepository wordRepository;
    private final AIService aiService;

    @Override
    public WordDTO create(Long userId, WordCreateRequest request) {
        Word word = Word.builder()
                .userId(userId)
                .word(request.getWord())
                .phonetic(request.getPhonetic())
                .lang(request.getLang())
                .definition(request.getDefinition())
                .examples(request.getExamples())
                .notes(request.getNotes())
                .favorite(false)
                .reviewCount(0)
                .masteryLevel(0)
                .build();
        return toDTO(wordRepository.save(word));
    }

    @Override
    public WordDTO update(Long userId, Long id, WordCreateRequest request) {
        Word word = wordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Word not found"));
        if (!word.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        word.setWord(request.getWord());
        word.setPhonetic(request.getPhonetic());
        word.setLang(request.getLang());
        word.setDefinition(request.getDefinition());
        word.setExamples(request.getExamples());
        word.setNotes(request.getNotes());
        return toDTO(wordRepository.save(word));
    }

    @Override
    public void delete(Long userId, Long id) {
        Word word = wordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Word not found"));
        if (!word.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        wordRepository.delete(word);
    }

    @Override
    public WordDTO getById(Long userId, Long id) {
        Word word = wordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Word not found"));
        if (!word.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        return toDTO(word);
    }

    @Override
    public PageResult<WordDTO> getByUserId(Long userId, int page, int size) {
        Page<Word> pageResult = wordRepository.findByUserId(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return toPageResult(pageResult);
    }

    @Override
    public List<WordDTO> getFavorites(Long userId) {
        return wordRepository.findByUserIdAndFavoriteTrue(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public WordDTO toggleFavorite(Long userId, Long id) {
        Word word = wordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Word not found"));
        if (!word.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        word.setFavorite(!word.getFavorite());
        return toDTO(wordRepository.save(word));
    }

    @Override
    public PageResult<WordDTO> search(Long userId, String keyword, int page, int size) {
        Page<Word> pageResult = wordRepository.findByUserIdAndWordContainingOrDefinitionContaining(
                userId, keyword, keyword,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return toPageResult(pageResult);
    }

    @Override
    public PageResult<WordDTO> getByMasteryLevel(Long userId, Integer level, int page, int size) {
        Page<Word> pageResult = wordRepository.findByUserIdAndMasteryLevel(
                userId, level,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return toPageResult(pageResult);
    }

    @Override
    public WordDTO generateKnowledge(Long userId, Long id) {
        Word word = wordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Word not found"));
        if (!word.getUserId().equals(userId)) {
            throw new BusinessException(403, "Access denied");
        }
        String knowledge = aiService.generateKnowledgePoint(
                word.getWord() + ": " + word.getDefinition(),
                word.getLang() != null ? word.getLang() : "en");
        word.setAiKnowledge(knowledge);
        return toDTO(wordRepository.save(word));
    }

    private WordDTO toDTO(Word word) {
        return WordDTO.builder()
                .id(word.getId())
                .word(word.getWord())
                .phonetic(word.getPhonetic())
                .lang(word.getLang())
                .definition(word.getDefinition())
                .examples(word.getExamples())
                .notes(word.getNotes())
                .aiKnowledge(word.getAiKnowledge())
                .favorite(word.getFavorite())
                .reviewCount(word.getReviewCount())
                .masteryLevel(word.getMasteryLevel())
                .createdAt(word.getCreatedAt())
                .updatedAt(word.getUpdatedAt())
                .build();
    }

    private PageResult<WordDTO> toPageResult(Page<Word> page) {
        return new PageResult<>(
                page.getContent().stream().map(this::toDTO).collect(Collectors.toList()),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize());
    }
}
