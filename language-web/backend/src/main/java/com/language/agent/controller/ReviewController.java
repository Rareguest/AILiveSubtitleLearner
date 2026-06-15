package com.language.agent.controller;

import com.language.agent.dto.ApiResponse;
import com.language.agent.dto.ReviewResultDTO;
import com.language.agent.entity.ReviewRecord;
import com.language.agent.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/due")
    public ApiResponse<List<ReviewRecord>> getDueItems(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(reviewService.getDueItems(userId));
    }

    @PostMapping("/submit")
    public ApiResponse<ReviewRecord> submitReview(@AuthenticationPrincipal String userIdStr,
                                                   @Valid @RequestBody ReviewResultDTO result) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(reviewService.submitReview(userId, result));
    }

    @GetMapping("/count")
    public ApiResponse<Long> getDueCount(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(reviewService.getDueCount(userId));
    }
}
