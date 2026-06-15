package com.language.agent.controller;

import com.language.agent.dto.*;
import com.language.agent.service.SentenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sentences")
@RequiredArgsConstructor
public class SentenceController {

    private final SentenceService sentenceService;

    @PostMapping
    public ApiResponse<SentenceDTO> create(@AuthenticationPrincipal String userIdStr,
                                            @Valid @RequestBody SentenceCreateRequest request) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.create(userId, request));
    }

    @GetMapping
    public ApiResponse<PageResult<SentenceDTO>> list(@AuthenticationPrincipal String userIdStr,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.getByUserId(userId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<SentenceDTO> getById(@AuthenticationPrincipal String userIdStr,
                                             @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.getById(userId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<SentenceDTO> update(@AuthenticationPrincipal String userIdStr,
                                            @PathVariable Long id,
                                            @Valid @RequestBody SentenceCreateRequest request) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal String userIdStr,
                                     @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        sentenceService.delete(userId, id);
        return ApiResponse.success(null);
    }

    @GetMapping("/favorite")
    public ApiResponse<List<SentenceDTO>> favorites(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.getFavorites(userId));
    }

    @GetMapping("/search")
    public ApiResponse<PageResult<SentenceDTO>> search(@AuthenticationPrincipal String userIdStr,
                                                        @RequestParam String keyword,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.search(userId, keyword, page, size));
    }

    @PostMapping("/{id}/favorite")
    public ApiResponse<SentenceDTO> toggleFavorite(@AuthenticationPrincipal String userIdStr,
                                                    @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.toggleFavorite(userId, id));
    }

    @PostMapping("/{id}/knowledge")
    public ApiResponse<SentenceDTO> generateKnowledge(@AuthenticationPrincipal String userIdStr,
                                                       @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(sentenceService.generateKnowledge(userId, id));
    }
}
