package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parking.dto.ParkingSlotRequest;
import com.example.parking.model.ParkingLot;
import com.example.parking.model.ParkingSlot;
import com.example.parking.repository.ParkingLotRepository;
import com.example.parking.repository.ParkingSlotRepository;

@Service
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;

    public ParkingSlotService(
            ParkingSlotRepository parkingSlotRepository,
            ParkingLotRepository parkingLotRepository) {

        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingLotRepository = parkingLotRepository;
    }

    public ParkingSlot createSlot(
            Long parkingLotId,
            ParkingSlotRequest request) {

        ParkingLot parkingLot =
                parkingLotRepository.findById(parkingLotId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parking lot not found"));

        if (parkingSlotRepository
                .findBySlotNumberAndParkingLotId(
                        request.getSlotNumber(),
                        parkingLotId)
                .isPresent()) {

            throw new RuntimeException(
                    "Slot number already exists");
        }

        ParkingSlot slot = new ParkingSlot();

        slot.setSlotNumber(request.getSlotNumber());
        slot.setStatus("AVAILABLE");
        slot.setSize(request.getSize());
        slot.setParkingLot(parkingLot);

        LocalDateTime now = LocalDateTime.now();

        slot.setCreatedAt(now);
        slot.setUpdatedAt(now);

        return parkingSlotRepository.save(slot);
    }

    public List<ParkingSlot> getSlotsByParkingLot(
            Long parkingLotId) {

        return parkingSlotRepository
                .findByParkingLotId(parkingLotId);
    }

    public List<ParkingSlot> getAvailableSlots(
            Long parkingLotId) {

        return parkingSlotRepository
                .findByParkingLotIdAndStatus(
                        parkingLotId,
                        "AVAILABLE");
    }

    public void generateSlots(Long parkingLotId) {

        ParkingLot parkingLot =
                parkingLotRepository.findById(parkingLotId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parking lot not found"));

        List<ParkingSlot> existingSlots =
                parkingSlotRepository
                        .findByParkingLotId(parkingLotId);

        int existingCount = existingSlots.size();

        LocalDateTime now = LocalDateTime.now();

        for (int i = existingCount + 1;
             i <= parkingLot.getTotalSlots();
             i++) {

            ParkingSlot slot = new ParkingSlot();

            slot.setSlotNumber(
                    String.format("A%02d", i));

            slot.setStatus("AVAILABLE");

            if (i <= 4) {
                slot.setSize("SMALL");
            } else if (i <= 8) {
                slot.setSize("MEDIUM");
            } else {
                slot.setSize("LARGE");
            }

            slot.setParkingLot(parkingLot);
            slot.setCreatedAt(now);
            slot.setUpdatedAt(now);

            parkingSlotRepository.save(slot);
        }
    }
}