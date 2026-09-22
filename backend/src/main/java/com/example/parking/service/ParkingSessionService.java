package com.example.parking.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.parking.dto.ParkingSessionRequest;
import com.example.parking.model.ParkingLot;
import com.example.parking.model.ParkingSession;
import com.example.parking.model.ParkingSlot;
import com.example.parking.model.User;
import com.example.parking.model.Vehicle;
import com.example.parking.repository.ParkingSessionRepository;
import com.example.parking.repository.ParkingSlotRepository;
import com.example.parking.repository.UserRepository;
import com.example.parking.repository.VehicleRepository;

@Service
public class ParkingSessionService {

    private final ParkingSessionRepository parkingSessionRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;

    public ParkingSessionService(
            ParkingSessionRepository parkingSessionRepository,
            VehicleRepository vehicleRepository,
            ParkingSlotRepository parkingSlotRepository,
            UserRepository userRepository) {

        this.parkingSessionRepository = parkingSessionRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.userRepository = userRepository;
    }

    // =========================
    // CHECK-IN
    // =========================

    @Transactional
    public ParkingSession checkIn(
            ParkingSessionRequest request,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Vehicle vehicle = vehicleRepository.findById(
                request.getVehicleId())
                .orElseThrow(() ->
                        new RuntimeException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {

            throw new RuntimeException(
                    "You are not allowed to use this vehicle");
        }

        if (!parkingSessionRepository
                .findByVehicleIdAndStatus(
                        vehicle.getId(), "ACTIVE")
                .isEmpty()) {

            throw new RuntimeException(
                    "Vehicle already has an active parking session");
        }

        ParkingSlot slot = parkingSlotRepository.findById(
                request.getParkingSlotId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parking slot not found"));

        if (!"AVAILABLE".equals(slot.getStatus())) {

            throw new RuntimeException(
                    "Parking slot is not available");
        }

        String requiredSize;

        if ("TWO_WHEELER".equalsIgnoreCase(
                vehicle.getVehicleType())) {

            requiredSize = "SMALL";

        } else if ("CAR".equalsIgnoreCase(
                vehicle.getVehicleType())) {

            requiredSize = "MEDIUM";

        } else if ("HEAVY_VEHICLE".equalsIgnoreCase(
                vehicle.getVehicleType())) {

            requiredSize = "LARGE";

        } else {

            throw new RuntimeException(
                    "Unsupported vehicle type");
        }

        if (!requiredSize.equalsIgnoreCase(
                slot.getSize())) {

            throw new RuntimeException(
                    "Vehicle cannot use this slot size");
        }

        ParkingLot parkingLot =
                slot.getParkingLot();

        if (!parkingLot.getActive()) {

            throw new RuntimeException(
                    "Parking lot is not active");
        }

        if (parkingLot.getAvailableSlots() == null
                || parkingLot.getAvailableSlots() <= 0) {

            throw new RuntimeException(
                    "No available slots in this parking lot");
        }

        ParkingSession session =
                new ParkingSession();

        session.setVehicle(vehicle);
        session.setParkingSlot(slot);
        session.setCheckInTime(
                LocalDateTime.now());

        session.setFee(BigDecimal.ZERO);
        session.setStatus("ACTIVE");

        slot.setStatus("OCCUPIED");
        slot.setUpdatedAt(
                LocalDateTime.now());

        parkingLot.setAvailableSlots(
                parkingLot.getAvailableSlots() - 1);

        parkingLot.setUpdatedAt(
                LocalDateTime.now());

        parkingSlotRepository.save(slot);

        return parkingSessionRepository.save(session);
    }

    // =========================
    // CHECK-OUT
    // =========================

    @Transactional
    public ParkingSession checkOut(
            Long sessionId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"));

        ParkingSession session =
                parkingSessionRepository.findById(
                        sessionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parking session not found"));

        if (!session.getVehicle()
                .getUser()
                .getId()
                .equals(user.getId())) {

            throw new RuntimeException(
                    "You are not allowed to check out this vehicle");
        }

        if (!"ACTIVE".equals(
                session.getStatus())) {

            throw new RuntimeException(
                    "Parking session is already completed");
        }

        LocalDateTime checkOutTime =
                LocalDateTime.now();

        session.setCheckOutTime(
                checkOutTime);

        // =========================
        // CALCULATE PARKING TIME
        // =========================

        long minutes = Duration.between(
                session.getCheckInTime(),
                checkOutTime)
                .toMinutes();

        long hours =
                (minutes + 59) / 60;

        if (hours < 1) {
            hours = 1;
        }

        // =========================
        // DETERMINE HOURLY RATE
        // =========================

        String vehicleType =
                session.getVehicle()
                        .getVehicleType();

        BigDecimal hourlyRate;

        if ("TWO_WHEELER".equalsIgnoreCase(
                vehicleType)) {

            hourlyRate =
                    BigDecimal.valueOf(10);

        } else if ("CAR".equalsIgnoreCase(
                vehicleType)) {

            hourlyRate =
                    BigDecimal.valueOf(20);

        } else if ("HEAVY_VEHICLE".equalsIgnoreCase(
                vehicleType)) {

            hourlyRate =
                    BigDecimal.valueOf(40);

        } else {

            throw new RuntimeException(
                    "Unsupported vehicle type");
        }

        // =========================
        // CALCULATE FINAL FEE
        // =========================

        BigDecimal fee =
                hourlyRate.multiply(
                        BigDecimal.valueOf(hours));

        session.setFee(fee);
        session.setStatus("COMPLETED");

        // =========================
        // FREE PARKING SLOT
        // =========================

        ParkingSlot slot =
                session.getParkingSlot();

        slot.setStatus("AVAILABLE");
        slot.setUpdatedAt(checkOutTime);

        // =========================
        // UPDATE PARKING LOT
        // =========================

        ParkingLot parkingLot =
                slot.getParkingLot();

        parkingLot.setAvailableSlots(
                parkingLot.getAvailableSlots() + 1);

        parkingLot.setUpdatedAt(
                checkOutTime);

        parkingSlotRepository.save(slot);

        return parkingSessionRepository.save(session);
    }

    // =========================
    // GET MY PARKING HISTORY
    // =========================

    public List<ParkingSession> getMySessions(
            String email) {

        return parkingSessionRepository
                .findByVehicleUserEmailOrderByCheckInTimeDesc(
                        email);
    }
}