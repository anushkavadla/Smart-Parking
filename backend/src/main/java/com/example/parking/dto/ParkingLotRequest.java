package com.example.parking.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParkingLotRequest {

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in name")
    private String name;

    @NotBlank
    @Size(max = 255)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in location")
    private String location;

    @NotNull
    @Min(1)
    @Max(10000)
    private Integer totalSlots;
}