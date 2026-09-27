package com.example.parking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservationRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private Long parkingSlotId;

    // ISO-8601 date-time strings, e.g. "2026-09-25T10:00:00"
    @NotNull
    private String startTime;

    @NotNull
    private String endTime;
}
