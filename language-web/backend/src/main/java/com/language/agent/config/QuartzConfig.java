package com.language.agent.config;

import com.language.agent.scheduled.ReviewReminderJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    @Bean
    public JobDetail reviewReminderJobDetail() {
        return JobBuilder.newJob(ReviewReminderJob.class)
                .withIdentity("reviewReminderJob", "reminder")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger reviewReminderTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(reviewReminderJobDetail())
                .withIdentity("reviewReminderTrigger", "reminder")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0 9 * * ?"))
                .build();
    }
}
