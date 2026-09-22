package com.example.parking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ParkingSessionRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private Long parkingSlotId;
}