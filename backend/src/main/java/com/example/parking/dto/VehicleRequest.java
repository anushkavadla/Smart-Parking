package com.example.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VehicleRequest {

    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9\\- ]{0,19}$",
            message = "Invalid vehicle number")
    private String vehicleNumber;

    @NotBlank
    @Size(max = 20)
    // Authoritative whitelist — matches the server-side size rules
    // (TWO_WHEELER -> SMALL, CAR -> MEDIUM, HEAVY_VEHICLE -> LARGE).
    @Pattern(regexp = "(?i)^(TWO_WHEELER|CAR|HEAVY_VEHICLE)$",
            message = "Unsupported vehicle type")
    private String vehicleType;

    @Size(max = 50)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in brand")
    private String brand;

    @Size(max = 50)
    @Pattern(regexp = "^[^<>]*$",
            message = "Invalid characters in model")
    private String model;
}