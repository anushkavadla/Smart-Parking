package com.example.parking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parking.model.ParkingLevel;

public interface ParkingLevelRepository
        extends JpaRepository<ParkingLevel, Long> {

    Optional<ParkingLevel> findByLevelCode(String levelCode);

    List<ParkingLevel> findByStatusOrderByLevelCodeAsc(String status);
}
