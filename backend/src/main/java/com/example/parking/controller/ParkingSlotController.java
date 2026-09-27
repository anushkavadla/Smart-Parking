package com.example.parking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.parking.dto.AvailabilityResponse;
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

    @GetMapping("/level/{levelCode}")
    public ResponseEntity<List<ParkingSlot>> getSlotsByLevel(
            @PathVariable String levelCode) {

        return ResponseEntity.ok(
                parkingSlotService.getSlotsByLevelCode(levelCode));
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability() {
        return ResponseEntity.ok(
                parkingSlotService.getAvailability());
    }

    @GetMapping("/find")
    public ResponseEntity<ParkingSlot> findCompatibleSlot(
            @RequestParam String vehicleType,
            @RequestParam(required = false) String levelCode) {

        return ResponseEntity.ok(
                parkingSlotService.findCompatibleSlot(
                        vehicleType, levelCode));
    }

    @PutMapping("/{slotId}/status")
    public ResponseEntity<ParkingSlot> updateSlotStatus(
            @PathVariable Long slotId,
            @RequestParam String status,
            Authentication authentication) {

        return ResponseEntity.ok(
                parkingSlotService.updateSlotStatus(
                        slotId, status, authentication.getName()));
    }
}