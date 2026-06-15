package com.language.agent.service;

import com.language.agent.dto.DashboardStatsDTO;
import com.language.agent.entity.StudyStats;

import java.util.List;

public interface StatsService {

    DashboardStatsDTO getDashboardStats(Long userId);

    void recordStudy(Long userId, String type, int minutes);

    List<StudyStats> getWeeklyStats(Long userId);
}
