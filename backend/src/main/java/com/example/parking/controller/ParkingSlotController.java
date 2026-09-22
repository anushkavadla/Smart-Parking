package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.ParkingSlotRequest;
import com.example.parking.model.ParkingSlot;
import com.example.parking.service.ParkingSlotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/parking-slots")
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    public ParkingSlotController(
            ParkingSlotService parkingSlotService) {

        this.parkingSlotService = parkingSlotService;
    }

    @PostMapping("/{lotId}")
    public ResponseEntity<ParkingSlot> createSlot(
            @PathVariable Long lotId,
            @Valid @RequestBody ParkingSlotRequest request) {

        ParkingSlot slot =
                parkingSlotService.createSlot(
                        lotId,
                        request);

        return ResponseEntity.ok(slot);
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<List<ParkingSlot>> getSlotsByParkingLot(
            @PathVariable Long lotId) {

        List<ParkingSlot> slots =
                parkingSlotService
                        .getSlotsByParkingLot(lotId);

        return ResponseEntity.ok(slots);
    }

    @GetMapping("/lot/{lotId}/available")
    public ResponseEntity<List<ParkingSlot>> getAvailableSlots(
            @PathVariable Long lotId) {

        List<ParkingSlot> slots =
                parkingSlotService
                        .getAvailableSlots(lotId);

        return ResponseEntity.ok(slots);
    }

    @PostMapping("/generate/{lotId}")
    public ResponseEntity<String> generateSlots(
            @PathVariable Long lotId) {

        parkingSlotService.generateSlots(lotId);

        return ResponseEntity.ok(
                "Parking slots generated successfully");
    }
}