package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.ParkingLevelRequest;
import com.example.parking.model.ParkingLevel;
import com.example.parking.service.ParkingLevelService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/parking-levels")
public class ParkingLevelController {

    private final ParkingLevelService parkingLevelService;

    public ParkingLevelController(
            ParkingLevelService parkingLevelService) {

        this.parkingLevelService = parkingLevelService;
    }

    @GetMapping
    public ResponseEntity<List<ParkingLevel>> listLevels() {
        return ResponseEntity.ok(parkingLevelService.listLevels());
    }

    @GetMapping("/{levelCode}")
    public ResponseEntity<ParkingLevel> getLevel(
            @PathVariable String levelCode) {

        return ResponseEntity.ok(
                parkingLevelService.getByCode(levelCode));
    }

    @PostMapping
    public ResponseEntity<ParkingLevel> createLevel(
            @Valid @RequestBody ParkingLevelRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                parkingLevelService.createLevel(
                        request, authentication.getName()));
    }
}
