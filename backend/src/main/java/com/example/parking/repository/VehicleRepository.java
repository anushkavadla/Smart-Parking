package com.example.parking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parking.model.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByUserId(Long userId);

    Optional<Vehicle> findByVehicleNumber(String vehicleNumber);
}