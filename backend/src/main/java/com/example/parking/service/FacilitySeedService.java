package com.example.parking.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.parking.model.ParkingLevel;
import com.example.parking.model.ParkingLot;
import com.example.parking.model.ParkingSlot;
import com.example.parking.repository.ParkingLevelRepository;
import com.example.parking.repository.ParkingLotRepository;
import com.example.parking.repository.ParkingSessionRepository;
import com.example.parking.repository.ParkingSlotRepository;
import com.example.parking.repository.ReservationRepository;

// Idempotent demo-facility bootstrap. Runs at startup and reconciles
// the database toward the canonical facility:
//
//   P1 / P2 / P3  ×  (10 SMALL + 25 MEDIUM + 5 LARGE)
//   P#-S01…S10, P#-M01…M25, P#-L01…L05  →  120 bays total.
//
// Rules:
// - Existing levels P1/P2/P3 are kept, missing ones are created.
// - Bays that already match a canonical (level, number, size) entry
//   are claimed and never touched.
// - Any other bay of the main lot that is free (AVAILABLE, no ACTIVE
//   session, no live reservation hold) is MIGRATED into the first free
//   canonical entry (renamed + resized + re-levelled). Nothing is
//   deleted; the 10 legacy A-numbered bays are absorbed this way.
// - Bays that are OCCUPIED / RESERVED / in an ACTIVE session / under a
//   live reservation hold are left completely untouched, as is every
//   bay belonging to another parking lot.
// - Remaining canonical entries are created as AVAILABLE bays.
// Re-running changes nothing once the facility is complete.
@Service
public class FacilitySeedService {

    private static final Logger log =
            LoggerFactory.getLogger(FacilitySeedService.class);

    private static final String[] LEVEL_CODES = { "P1", "P2", "P3" };

    // prefix, size, count per level
    private static final String[][] SIZE_PLAN = {
            { "S", "SMALL", "10" },
            { "M", "MEDIUM", "25" },
            { "L", "LARGE", "5" },
    };

    private final ParkingLevelRepository parkingLevelRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ReservationRepository reservationRepository;

    public FacilitySeedService(
            ParkingLevelRepository parkingLevelRepository,
            ParkingSlotRepository parkingSlotRepository,
            ParkingLotRepository parkingLotRepository,
            ParkingSessionRepository parkingSessionRepository,
            ReservationRepository reservationRepository) {

        this.parkingLevelRepository = parkingLevelRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public void seedIfNeeded() {
        ParkingLot lot = ensureLot();
        normalizeFacilityIdentity(lot);
        List<ParkingLevel> levels = ensureLevels();
        reconcileFacility(lot, levels);
        refreshLotCounters(lot);
        logSummary(levels);
    }

    private ParkingLot ensureLot() {
        return parkingLotRepository.findByActiveTrue()
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    ParkingLot lot = new ParkingLot();
                    lot.setName("Smart Parking — Main Facility");
                    lot.setLocation("Main Facility");
                    lot.setTotalSlots(0);
                    lot.setAvailableSlots(0);
                    lot.setActive(true);
                    LocalDateTime now = LocalDateTime.now();
                    lot.setCreatedAt(now);
                    lot.setUpdatedAt(now);
                    return parkingLotRepository.save(lot);
                });
    }

    // The system is a generic Smart Parking facility. Legacy rows
    // created under university-specific names ("AU Main Parking",
    // "Anurag University", campus …) surface verbatim in the UI
    // (Home, Parking, receipts), so normalize them once here.
    // Display-only change: lookups are by id, nothing breaks.
    private void normalizeFacilityIdentity(ParkingLot lot) {
        boolean changed = false;
        if (lot.getName() != null
                && lot.getName().matches("(?i).*(\\bAU\\b.*park|anurag|campus|university).*")
                && !lot.getName().startsWith("Smart Parking")) {
            log.info("Seed: renaming legacy facility '{}' -> 'Smart Parking — Main Facility'",
                    lot.getName());
            lot.setName("Smart Parking — Main Facility");
            changed = true;
        }
        if (lot.getLocation() != null
                && lot.getLocation().matches("(?i).*(anurag|campus|university).*")) {
            log.info("Seed: normalizing legacy facility location '{}' -> 'Main Facility'",
                    lot.getLocation());
            lot.setLocation("Main Facility");
            changed = true;
        }
        if (changed) {
            lot.setUpdatedAt(LocalDateTime.now());
            parkingLotRepository.save(lot);
        }
    }

    private List<ParkingLevel> ensureLevels() {
        List<ParkingLevel> levels = new ArrayList<>();
        for (String code : LEVEL_CODES) {
            ParkingLevel level = parkingLevelRepository
                    .findByLevelCode(code)
                    .orElseGet(() -> {
                        ParkingLevel created = new ParkingLevel();
                        created.setLevelCode(code);
                        created.setName("Level " + code);
                        created.setCapacity(40);
                        created.setStatus("ACTIVE");
                        LocalDateTime now = LocalDateTime.now();
                        created.setCreatedAt(now);
                        created.setUpdatedAt(now);
                        return parkingLevelRepository.save(created);
                    });
            levels.add(level);
        }
        return levels;
    }

    // Canonical plan: level code -> ordered list of (slotNumber, size).
    private static Map<String, List<String[]>> canonicalPlan() {
        Map<String, List<String[]>> plan = new HashMap<>();
        for (String code : LEVEL_CODES) {
            List<String[]> entries = new ArrayList<>();
            for (String[] row : SIZE_PLAN) {
                String prefix = row[0];
                String size = row[1];
                int count = Integer.parseInt(row[2]);
                for (int i = 1; i <= count; i++) {
                    entries.add(new String[] {
                            String.format("%s-%s%02d", code, prefix, i),
                            size,
                    });
                }
            }
            plan.put(code, entries);
        }
        return plan;
    }

    private void reconcileFacility(
            ParkingLot lot,
            List<ParkingLevel> levels) {

        Map<String, List<String[]>> plan = canonicalPlan();
        Map<String, ParkingLevel> levelByCode = new HashMap<>();
        for (ParkingLevel level : levels) {
            levelByCode.put(level.getLevelCode(), level);
        }

        // Slots whose state must never be rewritten: occupied / held
        // bays, ACTIVE sessions and live reservation holds.
        Set<Long> heldSlotIds = new HashSet<>();
        for (ParkingSlot slot : parkingSlotRepository.findAll()) {
            if ("OCCUPIED".equals(slot.getStatus())
                    || "RESERVED".equals(slot.getStatus())) {
                heldSlotIds.add(slot.getId());
            }
        }
        for (com.example.parking.model.ParkingSession session
                : parkingSessionRepository.findByStatus("ACTIVE")) {
            if (session.getParkingSlot() != null) {
                heldSlotIds.add(session.getParkingSlot().getId());
            }
        }
        for (com.example.parking.model.Reservation reservation
                : reservationRepository.findByStatus("CONFIRMED")) {
            heldSlotIds.add(reservation.getParkingSlot().getId());
        }
        for (com.example.parking.model.Reservation reservation
                : reservationRepository.findByStatus("ACTIVE")) {
            heldSlotIds.add(reservation.getParkingSlot().getId());
        }

        // Claim canonical entries already satisfied exactly, and track
        // every number taken within the main lot.
        Set<String> claimed = new HashSet<>();
        Set<String> takenNumbers = new HashSet<>();
        List<ParkingSlot> lotSlots = parkingSlotRepository
                .findByParkingLotId(lot.getId());

        for (ParkingSlot slot : lotSlots) {
            takenNumbers.add(slot.getSlotNumber());
            String code = slot.getLevel() != null
                    ? slot.getLevel().getLevelCode()
                    : null;
            if (code != null && plan.containsKey(code)) {
                for (String[] entry : plan.get(code)) {
                    if (entry[0].equals(slot.getSlotNumber())
                            && entry[1].equals(slot.getSize())) {
                        claimed.add(code + "|" + entry[0]);
                        break;
                    }
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        int migrated = 0;

        // Migrate free, non-canonical bays (e.g. legacy A01…A10) into
        // the first free canonical entry, preferring their level.
        for (ParkingSlot slot : lotSlots) {
            String code = slot.getLevel() != null
                    ? slot.getLevel().getLevelCode()
                    : null;
            boolean exact = false;
            if (code != null && plan.containsKey(code)) {
                for (String[] entry : plan.get(code)) {
                    if (entry[0].equals(slot.getSlotNumber())
                            && entry[1].equals(slot.getSize())
                            && claimed.contains(code + "|" + entry[0])) {
                        exact = true;
                        break;
                    }
                }
            }
            if (exact || heldSlotIds.contains(slot.getId())) {
                continue;
            }

            List<String> tryCodes = new ArrayList<>();
            if (code != null && plan.containsKey(code)) {
                tryCodes.add(code);
            }
            for (String fallback : LEVEL_CODES) {
                if (!tryCodes.contains(fallback)) {
                    tryCodes.add(fallback);
                }
            }

            boolean placed = false;
            for (String targetCode : tryCodes) {
                for (String[] entry : plan.get(targetCode)) {
                    String key = targetCode + "|" + entry[0];
                    if (claimed.contains(key)
                            || takenNumbers.contains(entry[0])) {
                        continue;
                    }
                    takenNumbers.remove(slot.getSlotNumber());
                    slot.setSlotNumber(entry[0]);
                    slot.setSize(entry[1]);
                    slot.setLevel(levelByCode.get(targetCode));
                    slot.setUpdatedAt(now);
                    parkingSlotRepository.save(slot);
                    claimed.add(key);
                    takenNumbers.add(entry[0]);
                    migrated++;
                    placed = true;
                    break;
                }
                if (placed) {
                    break;
                }
            }
            if (!placed) {
                log.warn(
                        "Seed: no free canonical bay left for slot id={} number={}; left untouched",
                        slot.getId(), slot.getSlotNumber());
            }
        }

        // Create every canonical entry that is still missing.
        int created = 0;
        for (ParkingLevel level : levels) {
            for (String[] entry : plan.get(level.getLevelCode())) {
                String key = level.getLevelCode() + "|" + entry[0];
                if (claimed.contains(key)) {
                    continue;
                }
                if (parkingSlotRepository
                        .findBySlotNumberAndParkingLotId(
                                entry[0], lot.getId())
                        .isPresent()) {
                    claimed.add(key);
                    continue;
                }
                ParkingSlot slot = new ParkingSlot();
                slot.setSlotNumber(entry[0]);
                slot.setStatus("AVAILABLE");
                slot.setSize(entry[1]);
                slot.setParkingLot(lot);
                slot.setLevel(level);
                slot.setCreatedAt(now);
                slot.setUpdatedAt(now);
                parkingSlotRepository.save(slot);
                claimed.add(key);
                created++;
            }
        }

        log.info("Seed: migrated {} existing bays, created {} new bays",
                migrated, created);
    }

    private void refreshLotCounters(ParkingLot lot) {
        List<ParkingSlot> slots =
                parkingSlotRepository.findByParkingLotId(lot.getId());
        long available = slots.stream()
                .filter(slot -> "AVAILABLE".equals(slot.getStatus()))
                .count();
        lot.setTotalSlots(slots.size());
        lot.setAvailableSlots((int) available);
        lot.setUpdatedAt(LocalDateTime.now());
        parkingLotRepository.save(lot);
    }

    private void logSummary(List<ParkingLevel> levels) {
        Map<String, List<String[]>> plan = canonicalPlan();
        Set<String> canonicalKeys = new HashSet<>();
        for (Map.Entry<String, List<String[]>> e : plan.entrySet()) {
            for (String[] entry : e.getValue()) {
                canonicalKeys.add(e.getKey() + "|" + entry[0]);
            }
        }
        long grandTotal = 0;
        for (ParkingLevel level : levels) {
            List<ParkingSlot> slots = parkingSlotRepository
                    .findByLevelId(level.getId());
            Map<String, Long> bySize = new HashMap<>();
            for (ParkingSlot slot : slots) {
                bySize.merge(slot.getSize(), 1L, Long::sum);
            }
            grandTotal += slots.size();
            log.info("Seed facility: {} total={} SMALL={} MEDIUM={} LARGE={}",
                    level.getLevelCode(),
                    slots.size(),
                    bySize.getOrDefault("SMALL", 0L),
                    bySize.getOrDefault("MEDIUM", 0L),
                    bySize.getOrDefault("LARGE", 0L));
        }
        // Any row outside the canonical plan is pre-existing live data
        // that was deliberately preserved (occupied / held bays).
        for (ParkingSlot slot : parkingSlotRepository.findAll()) {
            String code = slot.getLevel() != null
                    ? slot.getLevel().getLevelCode()
                    : "-";
            if (!canonicalKeys.contains(code + "|" + slot.getSlotNumber())) {
                log.info(
                        "Seed facility: preserved live bay id={} number={} level={} size={} status={}",
                        slot.getId(), slot.getSlotNumber(), code,
                        slot.getSize(), slot.getStatus());
            }
        }
        log.info("Seed facility: grand total parking_slots={}", grandTotal);
    }
}
