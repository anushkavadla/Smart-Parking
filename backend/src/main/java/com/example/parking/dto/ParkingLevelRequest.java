package com.example.parking.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParkingLevelRequest {

    @NotBlank
    @Size(max = 10)
    @Pattern(regexp = "^[A-Za-z0-9]{1,10}$",
            message = "Invalid level code")
    private String levelCode;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in name")
    private String name;

    @NotNull
    @Min(1)
    @Max(10000)
    private Integer capacity;
}
