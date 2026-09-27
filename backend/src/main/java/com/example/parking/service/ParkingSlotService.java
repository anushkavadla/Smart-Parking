package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parking.dto.AvailabilityResponse;
import com.example.parking.dto.ParkingSlotRequest;
import com.example.parking.model.ParkingLevel;
import com.example.parking.model.ParkingLot;
import com.example.parking.model.ParkingSlot;
import com.example.parking.repository.ParkingLevelRepository;
import com.example.parking.repository.ParkingLotRepository;
import com.example.parking.repository.ParkingSlotRepository;

@Service
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingLevelRepository parkingLevelRepository;
    private final UserRoleService userRoleService;

    public ParkingSlotService(
            ParkingSlotRepository parkingSlotRepository,
            ParkingLotRepository parkingLotRepository,
            ParkingLevelRepository parkingLevelRepository,
            UserRoleService userRoleService) {

        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.parkingLevelRepository = parkingLevelRepository;
        this.userRoleService = userRoleService;
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

    // =========================
    // LEVEL / AVAILABILITY / FIND
    // =========================

    public List<ParkingSlot> getSlotsByLevelCode(String levelCode) {
        return parkingSlotRepository
                .findByLevelLevelCode(levelCode.toUpperCase());
    }

    // Authoritative availability snapshot: global totals plus one
    // entry per parking level, computed from live slot rows.
    public AvailabilityResponse getAvailability() {
        List<ParkingSlot> slots = parkingSlotRepository.findAll();
        List<ParkingLevel> levels = parkingLevelRepository.findAll();
        levels.sort(Comparator.comparing(ParkingLevel::getLevelCode));

        AvailabilityResponse response = new AvailabilityResponse();
        response.setLevels(new ArrayList<>());

        Map<Long, AvailabilityResponse.LevelAvailability> byLevel =
                new HashMap<>();

        for (ParkingLevel level : levels) {
            AvailabilityResponse.LevelAvailability entry =
                    new AvailabilityResponse.LevelAvailability();
            entry.setLevelId(level.getId());
            entry.setLevelCode(level.getLevelCode());
            entry.setName(level.getName());
            entry.setCapacity(level.getCapacity());
            response.getLevels().add(entry);
            byLevel.put(level.getId(), entry);
        }

        for (ParkingSlot slot : slots) {
            String bucket = bucketOf(slot.getStatus());
            addTo(response, bucket);
            if (slot.getLevel() != null) {
                AvailabilityResponse.LevelAvailability entry =
                        byLevel.get(slot.getLevel().getId());
                if (entry != null) {
                    entry.setTotal(entry.getTotal() + 1);
                    addTo(entry, bucket);
                }
            }
        }

        response.setTotal(slots.size());
        return response;
    }

    private static String bucketOf(String status) {
        if ("AVAILABLE".equals(status)) return "AVAILABLE";
        if ("OCCUPIED".equals(status)) return "OCCUPIED";
        if ("RESERVED".equals(status)) return "RESERVED";
        return "OUT_OF_SERVICE";
    }

    private static void addTo(AvailabilityResponse response, String bucket) {
        switch (bucket) {
            case "AVAILABLE":
                response.setAvailable(response.getAvailable() + 1);
                break;
            case "OCCUPIED":
                response.setOccupied(response.getOccupied() + 1);
                break;
            case "RESERVED":
                response.setReserved(response.getReserved() + 1);
                break;
            default:
                response.setOutOfService(response.getOutOfService() + 1);
                break;
        }
    }

    private static void addTo(
            AvailabilityResponse.LevelAvailability entry,
            String bucket) {

        switch (bucket) {
            case "AVAILABLE":
                entry.setAvailable(entry.getAvailable() + 1);
                break;
            case "OCCUPIED":
                entry.setOccupied(entry.getOccupied() + 1);
                break;
            case "RESERVED":
                entry.setReserved(entry.getReserved() + 1);
                break;
            default:
                entry.setOutOfService(entry.getOutOfService() + 1);
                break;
        }
    }

    // Server-side compatible-slot search. Same size rules as check-in,
    // so the frontend can never approve a bay the server would reject.
    public ParkingSlot findCompatibleSlot(
            String vehicleType,
            String levelCode) {

        String requiredSize = requiredSizeFor(vehicleType);

        List<ParkingSlot> candidates =
                parkingSlotRepository.findByStatus("AVAILABLE");

        return candidates.stream()
                .filter(slot -> requiredSize.equalsIgnoreCase(slot.getSize()))
                .filter(slot -> levelCode == null
                        || levelCode.isBlank()
                        || (slot.getLevel() != null
                                && levelCode.equalsIgnoreCase(
                                        slot.getLevel().getLevelCode())))
                .sorted(Comparator.comparing(
                        ParkingSlot::getSlotNumber))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Compatible parking slot not found"));
    }

    public static String requiredSizeFor(String vehicleType) {
        if ("TWO_WHEELER".equalsIgnoreCase(vehicleType)) return "SMALL";
        if ("CAR".equalsIgnoreCase(vehicleType)) return "MEDIUM";
        if ("HEAVY_VEHICLE".equalsIgnoreCase(vehicleType)) return "LARGE";
        throw new RuntimeException("Unsupported vehicle type");
    }

    // Admin operations on individual bays (block a bay for maintenance,
    // hold it as reserved, or return it to service).
    public ParkingSlot updateSlotStatus(
            Long slotId,
            String status,
            String email) {

        userRoleService.requireAdmin(email);

        String target = status == null ? "" : status.trim().toUpperCase();

        if (!target.equals("AVAILABLE")
                && !target.equals("RESERVED")
                && !target.equals("OUT_OF_SERVICE")) {
            throw new RuntimeException("Unsupported slot status");
        }

        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() ->
                        new RuntimeException("Parking slot not found"));

        if ("OCCUPIED".equals(slot.getStatus())) {
            throw new RuntimeException(
                    "Occupied slots change only through check-out");
        }

        slot.setStatus(target);
        slot.setUpdatedAt(LocalDateTime.now());

        return parkingSlotRepository.save(slot);
    }
}
