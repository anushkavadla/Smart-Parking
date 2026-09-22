package com.example.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VehicleRequest {

    @NotBlank
    @Size(max = 20)
    private String vehicleNumber;

    @NotBlank
    @Size(max = 20)
    private String vehicleType;

    @Size(max = 50)
    private String brand;

    @Size(max = 50)
    private String model;
}