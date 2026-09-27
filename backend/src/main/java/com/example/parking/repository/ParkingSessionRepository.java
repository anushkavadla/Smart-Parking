package com.example.parking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parking.model.ParkingSession;

public interface ParkingSessionRepository
        extends JpaRepository<ParkingSession, Long> {

    List<ParkingSession> findByStatus(String status);

    Optional<ParkingSession> findByPaymentReference(String paymentReference);

    List<ParkingSession> findByVehicleId(Long vehicleId);

    List<ParkingSession> findByVehicleIdAndStatus(
            Long vehicleId,
            String status);

    List<ParkingSession> findByVehicleUserEmailOrderByCheckInTimeDesc(
            String email);

    List<ParkingSession> findByParkingSlotIdAndStatus(
            Long parkingSlotId,
            String status);
}