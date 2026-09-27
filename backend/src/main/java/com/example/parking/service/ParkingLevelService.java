package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parking.dto.ParkingLevelRequest;
import com.example.parking.model.ParkingLevel;
import com.example.parking.repository.ParkingLevelRepository;

@Service
public class ParkingLevelService {

    private final ParkingLevelRepository parkingLevelRepository;
    private final UserRoleService userRoleService;

    public ParkingLevelService(
            ParkingLevelRepository parkingLevelRepository,
            UserRoleService userRoleService) {

        this.parkingLevelRepository = parkingLevelRepository;
        this.userRoleService = userRoleService;
    }

    public List<ParkingLevel> listLevels() {
        List<ParkingLevel> levels = parkingLevelRepository.findAll();
        levels.sort(Comparator.comparing(ParkingLevel::getLevelCode));
        return levels;
    }

    public ParkingLevel getByCode(String levelCode) {
        return parkingLevelRepository
                .findByLevelCode(levelCode.toUpperCase())
                .orElseThrow(() ->
                        new RuntimeException("Parking level not found"));
    }

    public ParkingLevel createLevel(
            ParkingLevelRequest request,
            String email) {

        userRoleService.requireAdmin(email);

        String code = request.getLevelCode().trim().toUpperCase();

        if (parkingLevelRepository.findByLevelCode(code).isPresent()) {
            throw new RuntimeException("Parking level already exists");
        }

        ParkingLevel level = new ParkingLevel();

        level.setLevelCode(code);
        level.setName(request.getName());
        level.setCapacity(request.getCapacity());
        level.setStatus("ACTIVE");

        LocalDateTime now = LocalDateTime.now();

        level.setCreatedAt(now);
        level.setUpdatedAt(now);

        return parkingLevelRepository.save(level);
    }
}
