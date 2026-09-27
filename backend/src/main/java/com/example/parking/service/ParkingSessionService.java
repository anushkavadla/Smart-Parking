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
    private final ReservationService reservationService;

    public ParkingSessionService(
            ParkingSessionRepository parkingSessionRepository,
            VehicleRepository vehicleRepository,
            ParkingSlotRepository parkingSlotRepository,
            UserRepository userRepository,
            ReservationService reservationService) {

        this.parkingSessionRepository = parkingSessionRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.userRepository = userRepository;
        this.reservationService = reservationService;
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

            if ("RESERVED".equals(slot.getStatus())) {
                // The bay is held: only the owner of a live CONFIRMED
                // reservation for this exact vehicle + bay may proceed.
                reservationService.consumeForCheckIn(user, vehicle, slot);
            } else {
                throw new RuntimeException(
                        "Parking slot is not available");
            }
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
        session.setPaymentStatus("PENDING");

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
            String email,
            com.example.parking.dto.CheckoutRequest request) {

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

        // Payment is confirmed FIRST: any failure here leaves the
        // session ACTIVE, the bay OCCUPIED and nothing half-written.
        String method = request == null || request.getPaymentMethod() == null
                ? null
                : request.getPaymentMethod().trim().toUpperCase();

        if (!"UPI".equals(method)
                && !"CARD".equals(method)
                && !"CASH".equals(method)) {
            throw new RuntimeException(
                    "Payment method is required (UPI, CARD or CASH)");
        }

        String reference = request.getPaymentReference() == null
                ? null
                : request.getPaymentReference().trim();

        if (reference != null && !reference.matches("[A-Za-z0-9\\-]{1,40}")) {
            throw new RuntimeException("Invalid payment reference");
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
        session.setPaymentStatus("PAID");
        session.setPaymentMethod(method);
        session.setPaymentReference(
                reference != null ? reference : newPaymentReference());
        session.setPaidAt(checkOutTime);

        // =========================
        // FREE PARKING SLOT
        // =========================

        ParkingSlot slot =
                session.getParkingSlot();

        slot.setStatus("AVAILABLE");
        slot.setUpdatedAt(checkOutTime);

        // Close the linked reservation hold, if the session started
        // from one. Best-effort: never breaks the checkout flow.
        reservationService.completeForSession(
                session.getVehicle(), slot);

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

    private String newPaymentReference() {
        for (int i = 0; i < 5; i++) {
            String ref = "PAY-"
                    + java.util.UUID.randomUUID().toString()
                            .replace("-", "")
                            .substring(0, 8)
                            .toUpperCase();
            if (parkingSessionRepository
                    .findByPaymentReference(ref).isEmpty()) {
                return ref;
            }
        }
        throw new RuntimeException("Could not generate payment reference");
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