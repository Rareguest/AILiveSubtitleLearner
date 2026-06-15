package com.language.agent.controller;

import com.language.agent.dto.ApiResponse;
import com.language.agent.dto.DashboardStatsDTO;
import com.language.agent.entity.StudyStats;
import com.language.agent.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardStatsDTO> getDashboard(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(statsService.getDashboardStats(userId));
    }

    @GetMapping("/weekly")
    public ApiResponse<List<StudyStats>> getWeeklyStats(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(statsService.getWeeklyStats(userId));
    }
}
