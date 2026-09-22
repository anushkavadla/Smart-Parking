package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.VehicleRequest;
import com.example.parking.model.Vehicle;
import com.example.parking.service.VehicleService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<Vehicle> registerVehicle(
            @Valid @RequestBody VehicleRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        Vehicle vehicle = vehicleService.registerVehicle(
                request,
                email
        );

        return ResponseEntity.ok(vehicle);
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getMyVehicles(
            Authentication authentication) {

        String email = authentication.getName();

        List<Vehicle> vehicles =
                vehicleService.getMyVehicles(email);

        return ResponseEntity.ok(vehicles);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        Vehicle vehicle = vehicleService.updateVehicle(
                id,
                request,
                email
        );

        return ResponseEntity.ok(vehicle);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteVehicle(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        vehicleService.deleteVehicle(id, email);

        return ResponseEntity.ok(
                "Vehicle deleted successfully"
        );
    }
}