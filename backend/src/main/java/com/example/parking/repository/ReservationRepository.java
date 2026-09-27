package com.example.parking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parking.model.Reservation;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByReference(String reference);

    List<Reservation> findByVehicleUserEmailOrderByStartTimeDesc(String email);

    List<Reservation> findByVehicleIdAndStatus(Long vehicleId, String status);

    List<Reservation> findByParkingSlotIdAndStatus(Long parkingSlotId, String status);

    List<Reservation> findByStatus(String status);
}
