package com.example.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParkingSlotRequest {

    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "^[A-Za-z0-9\\-]{1,20}$",
            message = "Invalid slot number")
    private String slotNumber;

    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "(?i)^(SMALL|MEDIUM|LARGE)$",
            message = "Unsupported slot size")
    private String size;
}