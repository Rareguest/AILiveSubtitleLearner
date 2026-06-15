package com.language.agent.util;

import lombok.AllArgsConstructor;
import lombok.Data;

public class Sm2Algorithm {

    @Data
    @AllArgsConstructor
    public static class Sm2Result {
        private int interval;
        private float easeFactor;
    }

    public static Sm2Result calculate(int quality, int currentInterval, float currentEaseFactor) {
        float easeFactor = currentEaseFactor;
        int interval;

        if (quality >= 3) {
            easeFactor = Math.max(1.3f, currentEaseFactor + (0.1f - (5 - quality) * (0.08f + (5 - quality) * 0.02f)));

            if (currentInterval < 1) {
                interval = 1;
            } else if (currentInterval < 6) {
                interval = 6;
            } else {
                interval = Math.round(currentInterval * easeFactor);
            }
        } else {
            interval = 1;
        }

        return new Sm2Result(interval, easeFactor);
    }
}
