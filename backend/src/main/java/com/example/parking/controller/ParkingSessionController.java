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

import com.example.parking.dto.CheckoutRequest;
import com.example.parking.dto.ParkingSessionRequest;
import com.example.parking.model.ParkingSession;
import com.example.parking.service.ParkingSessionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/parking-sessions")
public class ParkingSessionController {

    private final ParkingSessionService parkingSessionService;

    public ParkingSessionController(
            ParkingSessionService parkingSessionService) {

        this.parkingSessionService = parkingSessionService;
    }

    @PostMapping("/check-in")
    public ResponseEntity<ParkingSession> checkIn(
            @Valid @RequestBody ParkingSessionRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        ParkingSession session =
                parkingSessionService.checkIn(
                        request,
                        email);

        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/check-out")
    public ResponseEntity<ParkingSession> checkOut(
            @PathVariable Long sessionId,
            @RequestBody(required = false) CheckoutRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        ParkingSession session =
                parkingSessionService.checkOut(sessionId, email, request);

        return ResponseEntity.ok(session);
    }

    @GetMapping
    public ResponseEntity<List<ParkingSession>> getMySessions(
            Authentication authentication) {

        String email = authentication.getName();

        List<ParkingSession> sessions =
                parkingSessionService.getMySessions(email);

        return ResponseEntity.ok(sessions);
    }
}