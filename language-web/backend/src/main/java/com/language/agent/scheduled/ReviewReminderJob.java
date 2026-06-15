package com.language.agent.scheduled;

import com.language.agent.repository.ReviewRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewReminderJob implements Job {

    private final ReviewRecordRepository reviewRecordRepository;

    @Override
    public void execute(JobExecutionContext context) {
        long dueCount = reviewRecordRepository.countByNextReviewAtBefore(LocalDateTime.now());

        if (dueCount > 0) {
            log.info("Review reminder: {} items are due for review", dueCount);
        } else {
            log.info("Review reminder: No items due for review");
        }
    }
}
