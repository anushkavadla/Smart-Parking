package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.parking.dto.ReservationRequest;
import com.example.parking.model.ParkingSlot;
import com.example.parking.model.Reservation;
import com.example.parking.model.User;
import com.example.parking.model.Vehicle;
import com.example.parking.repository.ParkingSessionRepository;
import com.example.parking.repository.ParkingSlotRepository;
import com.example.parking.repository.ReservationRepository;
import com.example.parking.repository.UserRepository;
import com.example.parking.repository.VehicleRepository;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final UserRoleService userRoleService;

    public ReservationService(
            ReservationRepository reservationRepository,
            ParkingSlotRepository parkingSlotRepository,
            ParkingSessionRepository parkingSessionRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            UserRoleService userRoleService) {

        this.reservationRepository = reservationRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.userRoleService = userRoleService;
    }

    // =========================
    // CREATE (hold a bay)
    // =========================

    @Transactional
    public Reservation createReservation(
            ReservationRequest request,
            String email) {

        sweepExpired();

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

        LocalDateTime start = parseTime(request.getStartTime());
        LocalDateTime end = parseTime(request.getEndTime());
        LocalDateTime now = LocalDateTime.now();

        if (!end.isAfter(start)) {
            throw new RuntimeException(
                    "Reservation end must be after start");
        }

        if (!end.isAfter(now)) {
            throw new RuntimeException(
                    "Reservation end must be in the future");
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
                        new RuntimeException("Parking slot not found"));

        String requiredSize =
                ParkingSlotService.requiredSizeFor(vehicle.getVehicleType());

        if (!requiredSize.equalsIgnoreCase(slot.getSize())) {
            throw new RuntimeException(
                    "Vehicle cannot use this slot size");
        }

        if (!"AVAILABLE".equals(slot.getStatus())) {
            throw new RuntimeException("Parking slot is not available");
        }

        if (overlapsLiveHold(slot.getId(), start, end, null)
                || overlapsLiveHoldForVehicle(
                        vehicle.getId(), start, end, null)) {
            throw new RuntimeException(
                    "Overlapping reservation already exists");
        }

        Reservation reservation = new Reservation();

        reservation.setReference(newReference());
        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setParkingSlot(slot);
        reservation.setStartTime(start);
        reservation.setEndTime(end);
        reservation.setStatus("CONFIRMED");

        reservation.setCreatedAt(now);
        reservation.setUpdatedAt(now);

        slot.setStatus("RESERVED");
        slot.setUpdatedAt(now);
        parkingSlotRepository.save(slot);

        return reservationRepository.save(reservation);
    }

    // =========================
    // LIST / CANCEL
    // =========================

    @Transactional
    public List<Reservation> myReservations(String email) {
        sweepExpired();
        return reservationRepository
                .findByVehicleUserEmailOrderByStartTimeDesc(email);
    }

    @Transactional
    public Reservation cancelReservation(Long id, String email) {
        sweepExpired();

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Reservation not found"));

        boolean owner = reservation.getUser().getEmail().equals(email);
        boolean admin = "ADMIN".equals(userRoleService.roleOf(email));

        if (!owner && !admin) {
            throw new RuntimeException(
                    "You are not allowed to cancel this reservation");
        }

        if ("ACTIVE".equals(reservation.getStatus())) {
            throw new RuntimeException(
                    "Reservation is already in use, check out instead");
        }

        if (!"CONFIRMED".equals(reservation.getStatus())) {
            throw new RuntimeException(
                    "Only confirmed reservations can be cancelled");
        }

        reservation.setStatus("CANCELLED");
        reservation.setUpdatedAt(LocalDateTime.now());

        freeSlotIfReserved(reservation.getParkingSlot().getId());

        return reservationRepository.save(reservation);
    }

    // =========================
    // SESSION LIFECYCLE HOOKS
    // =========================

    // Called by check-in when the bay is RESERVED: only the owner of a
    // live CONFIRMED hold for that exact vehicle + bay may proceed.
    @Transactional
    public void consumeForCheckIn(
            User user,
            Vehicle vehicle,
            ParkingSlot slot) {

        LocalDateTime now = LocalDateTime.now();

        Reservation reservation = reservationRepository
                .findByParkingSlotIdAndStatus(slot.getId(), "CONFIRMED")
                .stream()
                .filter(r -> r.getVehicle().getId().equals(vehicle.getId()))
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .filter(r -> !r.getStartTime().isAfter(now.plusMinutes(15)))
                .filter(r -> r.getEndTime().isAfter(now))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException("Parking slot is reserved"));

        reservation.setStatus("ACTIVE");
        reservation.setUpdatedAt(now);
        reservationRepository.save(reservation);
    }

    // Called by check-out. Best-effort: never breaks the checkout flow.
    @Transactional
    public void completeForSession(Vehicle vehicle, ParkingSlot slot) {
        reservationRepository
                .findByParkingSlotIdAndStatus(slot.getId(), "ACTIVE")
                .stream()
                .filter(r -> r.getVehicle().getId().equals(vehicle.getId()))
                .findFirst()
                .ifPresent(r -> {
                    r.setStatus("COMPLETED");
                    r.setUpdatedAt(LocalDateTime.now());
                    reservationRepository.save(r);
                });
    }

    // =========================
    // HELPERS
    // =========================

    // Lazily expires past CONFIRMED holds (no scheduler needed) and
    // returns their bays to AVAILABLE.
    @Transactional
    public void sweepExpired() {
        LocalDateTime now = LocalDateTime.now();
        for (Reservation r : reservationRepository.findByStatus("CONFIRMED")) {
            if (!r.getEndTime().isAfter(now)) {
                r.setStatus("EXPIRED");
                r.setUpdatedAt(now);
                reservationRepository.save(r);
                freeSlotIfReserved(r.getParkingSlot().getId());
            }
        }
    }

    private void freeSlotIfReserved(Long slotId) {
        parkingSlotRepository.findById(slotId).ifPresent(slot -> {
            if ("RESERVED".equals(slot.getStatus())) {
                slot.setStatus("AVAILABLE");
                slot.setUpdatedAt(LocalDateTime.now());
                parkingSlotRepository.save(slot);
            }
        });
    }

    private boolean overlapsLiveHold(
            Long slotId,
            LocalDateTime start,
            LocalDateTime end,
            Long ignoreId) {

        return reservationRepository
                .findByParkingSlotIdAndStatus(slotId, "CONFIRMED")
                .stream()
                .filter(r -> ignoreId == null || !r.getId().equals(ignoreId))
                .anyMatch(r -> overlaps(
                        r.getStartTime(), r.getEndTime(), start, end));
    }

    private boolean overlapsLiveHoldForVehicle(
            Long vehicleId,
            LocalDateTime start,
            LocalDateTime end,
            Long ignoreId) {

        return reservationRepository
                .findByVehicleIdAndStatus(vehicleId, "CONFIRMED")
                .stream()
                .filter(r -> ignoreId == null || !r.getId().equals(ignoreId))
                .anyMatch(r -> overlaps(
                        r.getStartTime(), r.getEndTime(), start, end));
    }

    private static boolean overlaps(
            LocalDateTime s1, LocalDateTime e1,
            LocalDateTime s2, LocalDateTime e2) {

        return s1.isBefore(e2) && s2.isBefore(e1);
    }

    private static LocalDateTime parseTime(String value) {
        try {
            return LocalDateTime.parse(value);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Invalid reservation time format, use ISO-8601");
        }
    }

    private String newReference() {
        for (int i = 0; i < 5; i++) {
            String ref = "RSV-"
                    + UUID.randomUUID().toString()
                            .replace("-", "")
                            .substring(0, 8)
                            .toUpperCase();
            if (reservationRepository.findByReference(ref).isEmpty()) {
                return ref;
            }
        }
        throw new RuntimeException("Could not generate reservation reference");
    }
}
