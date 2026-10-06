package com.example.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReservationRequest {

    @Positive
    private Long vehicleId;

    @Positive
    private Long parkingSlotId;

    // ISO-8601 date-time strings, e.g. "2026-09-25T10:00:00".
    // Parsed strictly server-side; format errors are rejected.
    @NotBlank
    @Size(max = 32)
    private String startTime;

    @NotBlank
    @Size(max = 32)
    private String endTime;
}
