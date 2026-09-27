package com.example.parking.dto;

import java.util.List;

import lombok.Data;

/* Authoritative availability snapshot computed by the backend from
 * live slot rows — global totals plus one entry per parking level. */
@Data
public class AvailabilityResponse {

    private int total;
    private int available;
    private int occupied;
    private int reserved;
    private int outOfService;
    private List<LevelAvailability> levels;

    @Data
    public static class LevelAvailability {

        private Long levelId;
        private String levelCode;
        private String name;
        private int capacity;
        private int total;
        private int available;
        private int occupied;
        private int reserved;
        private int outOfService;
    }
}
