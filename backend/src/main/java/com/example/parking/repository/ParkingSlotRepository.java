package com.example.parking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parking.model.ParkingSlot;

public interface ParkingSlotRepository
        extends JpaRepository<ParkingSlot, Long> {

    List<ParkingSlot> findByParkingLotId(Long parkingLotId);

    List<ParkingSlot> findByParkingLotIdAndStatus(
            Long parkingLotId,
            String status);

    Optional<ParkingSlot> findBySlotNumberAndParkingLotId(
            String slotNumber,
            Long parkingLotId);

    List<ParkingSlot> findByLevelId(Long levelId);

    List<ParkingSlot> findByLevelLevelCode(String levelCode);

    List<ParkingSlot> findByLevelLevelCodeAndStatus(
            String levelCode,
            String status);

    List<ParkingSlot> findByStatus(String status);
}