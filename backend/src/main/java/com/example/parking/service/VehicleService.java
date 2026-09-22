package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parking.dto.VehicleRequest;
import com.example.parking.model.User;
import com.example.parking.model.Vehicle;
import com.example.parking.repository.ParkingSessionRepository;
import com.example.parking.repository.UserRepository;
import com.example.parking.repository.VehicleRepository;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ParkingSessionRepository parkingSessionRepository;

    public VehicleService(
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            ParkingSessionRepository parkingSessionRepository) {

        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.parkingSessionRepository = parkingSessionRepository;
    }

    public Vehicle registerVehicle(
            VehicleRequest request,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (vehicleRepository
                .findByVehicleNumber(request.getVehicleNumber())
                .isPresent()) {

            throw new RuntimeException(
                    "Vehicle number already registered");
        }

        Vehicle vehicle = new Vehicle();

        vehicle.setVehicleNumber(
                request.getVehicleNumber());

        vehicle.setVehicleType(
                request.getVehicleType());

        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());

        vehicle.setUser(user);

        LocalDateTime now = LocalDateTime.now();

        vehicle.setCreatedAt(now);
        vehicle.setUpdatedAt(now);

        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getMyVehicles(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return vehicleRepository.findByUserId(user.getId());
    }
    public Vehicle updateVehicle(
        Long vehicleId,
        VehicleRequest request,
        String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

    if (!vehicle.getUser().getId().equals(user.getId())) {
        throw new RuntimeException(
                "You are not allowed to update this vehicle");
    }

    if (!vehicle.getVehicleNumber().equals(
            request.getVehicleNumber())
            && vehicleRepository
                    .findByVehicleNumber(
                            request.getVehicleNumber())
                    .isPresent()) {
        throw new RuntimeException(
                "Vehicle number already registered");
    }

    vehicle.setVehicleNumber(request.getVehicleNumber());
    vehicle.setVehicleType(request.getVehicleType());
    vehicle.setBrand(request.getBrand());
    vehicle.setModel(request.getModel());
    vehicle.setUpdatedAt(LocalDateTime.now());

    return vehicleRepository.save(vehicle);
}
public void deleteVehicle(
        Long vehicleId,
        String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

    if (!vehicle.getUser().getId().equals(user.getId())) {
        throw new RuntimeException(
                "You are not allowed to delete this vehicle");
    }

    if (!parkingSessionRepository
            .findByVehicleId(
                    vehicle.getId())
            .isEmpty()) {
        throw new RuntimeException(
                "Vehicle cannot be deleted because it has parking history");
    }

    vehicleRepository.delete(vehicle);
}
}