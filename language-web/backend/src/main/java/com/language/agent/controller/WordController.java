package com.language.agent.controller;

import com.language.agent.dto.*;
import com.language.agent.service.WordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;

    @PostMapping
    public ApiResponse<WordDTO> create(@AuthenticationPrincipal String userIdStr,
                                       @Valid @RequestBody WordCreateRequest request) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.create(userId, request));
    }

    @GetMapping
    public ApiResponse<PageResult<WordDTO>> list(@AuthenticationPrincipal String userIdStr,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.getByUserId(userId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<WordDTO> getById(@AuthenticationPrincipal String userIdStr,
                                         @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.getById(userId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<WordDTO> update(@AuthenticationPrincipal String userIdStr,
                                        @PathVariable Long id,
                                        @Valid @RequestBody WordCreateRequest request) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal String userIdStr,
                                     @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        wordService.delete(userId, id);
        return ApiResponse.success(null);
    }

    @GetMapping("/favorite")
    public ApiResponse<List<WordDTO>> favorites(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.getFavorites(userId));
    }

    @GetMapping("/search")
    public ApiResponse<PageResult<WordDTO>> search(@AuthenticationPrincipal String userIdStr,
                                                    @RequestParam String keyword,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.search(userId, keyword, page, size));
    }

    @PostMapping("/{id}/favorite")
    public ApiResponse<WordDTO> toggleFavorite(@AuthenticationPrincipal String userIdStr,
                                                @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.toggleFavorite(userId, id));
    }

    @PostMapping("/{id}/knowledge")
    public ApiResponse<WordDTO> generateKnowledge(@AuthenticationPrincipal String userIdStr,
                                                    @PathVariable Long id) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(wordService.generateKnowledge(userId, id));
    }
}
