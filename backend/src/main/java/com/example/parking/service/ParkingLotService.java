package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parking.dto.ParkingLotRequest;
import com.example.parking.model.ParkingLot;
import com.example.parking.repository.ParkingLotRepository;

@Service
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

    public ParkingLotService(
            ParkingLotRepository parkingLotRepository) {

        this.parkingLotRepository = parkingLotRepository;
    }

    public ParkingLot createParkingLot(
            ParkingLotRequest request) {

        ParkingLot parkingLot = new ParkingLot();

        parkingLot.setName(request.getName());
        parkingLot.setLocation(request.getLocation());
        parkingLot.setTotalSlots(request.getTotalSlots());

        // Initially, all slots are available
        parkingLot.setAvailableSlots(
                request.getTotalSlots());

        parkingLot.setActive(true);

        LocalDateTime now = LocalDateTime.now();

        parkingLot.setCreatedAt(now);
        parkingLot.setUpdatedAt(now);

        return parkingLotRepository.save(parkingLot);
    }

    public List<ParkingLot> getActiveParkingLots() {

        return parkingLotRepository.findByActiveTrue();
    }
}