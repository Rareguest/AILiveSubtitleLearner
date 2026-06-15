package com.language.agent.controller;

import com.language.agent.dto.*;
import com.language.agent.entity.ChatMessage;
import com.language.agent.entity.ContextType;
import com.language.agent.entity.MessageRole;
import com.language.agent.entity.Sentence;
import com.language.agent.entity.Word;
import com.language.agent.repository.SentenceRepository;
import com.language.agent.repository.WordRepository;
import com.language.agent.service.ChatService;
import com.language.agent.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ext")
@RequiredArgsConstructor
public class ExtensionController {

    private final WordRepository wordRepository;
    private final SentenceRepository sentenceRepository;
    private final ChatService chatService;
    private final StatsService statsService;

    @PostMapping("/sync-word")
    public ApiResponse<WordDTO> syncWord(@RequestBody WordCreateRequest request,
                                          @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        Word existing = wordRepository.findByUserIdAndWord(userId, request.getWord()).orElse(null);

        if (existing != null) {
            existing.setPhonetic(request.getPhonetic() != null ? request.getPhonetic() : existing.getPhonetic());
            existing.setLang(request.getLang() != null ? request.getLang() : existing.getLang());
            existing.setDefinition(request.getDefinition() != null ? request.getDefinition() : existing.getDefinition());
            existing.setExamples(request.getExamples() != null ? request.getExamples() : existing.getExamples());
            existing.setNotes(request.getNotes() != null ? request.getNotes() : existing.getNotes());
            Word saved = wordRepository.save(existing);
            return ApiResponse.success(toWordDTO(saved));
        }

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
        Word saved = wordRepository.save(word);
        statsService.recordStudy(userId, "WORD_ADDED", 0);
        return ApiResponse.success(toWordDTO(saved));
    }

    @PostMapping("/sync-sentence")
    public ApiResponse<SentenceDTO> syncSentence(@RequestBody SentenceCreateRequest request,
                                                    @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
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
        Sentence saved = sentenceRepository.save(sentence);
        statsService.recordStudy(userId, "SENTENCE_ADDED", 0);
        return ApiResponse.success(toSentenceDTO(saved));
    }

    private WordDTO toWordDTO(Word word) {
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

    private SentenceDTO toSentenceDTO(Sentence sentence) {
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
}
