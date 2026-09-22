package com.example.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParkingSlotRequest {

    @NotBlank
    @Size(max = 20)
    private String slotNumber;

    @NotBlank
    @Size(max = 20)
    private String size;
}