package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.ParkingLotRequest;
import com.example.parking.model.ParkingLot;
import com.example.parking.service.ParkingLotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;

    public ParkingLotController(
            ParkingLotService parkingLotService) {

        this.parkingLotService = parkingLotService;
    }

    @PostMapping
    public ResponseEntity<ParkingLot> createParkingLot(
            @Valid @RequestBody ParkingLotRequest request) {

        ParkingLot parkingLot =
                parkingLotService.createParkingLot(request);

        return ResponseEntity.ok(parkingLot);
    }

    @GetMapping
    public ResponseEntity<List<ParkingLot>> getActiveParkingLots() {

        List<ParkingLot> parkingLots =
                parkingLotService.getActiveParkingLots();

        return ResponseEntity.ok(parkingLots);
    }
}