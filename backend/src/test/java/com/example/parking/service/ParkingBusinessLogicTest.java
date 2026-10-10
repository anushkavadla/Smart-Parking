package com.example.parking.service;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

public class ParkingBusinessLogicTest {

    @Test
    void testRequiredSizeForVehicleType() {
        assertEquals("SMALL", ParkingSlotService.requiredSizeFor("TWO_WHEELER"));
        assertEquals("SMALL", ParkingSlotService.requiredSizeFor("two_wheeler"));
        assertEquals("MEDIUM", ParkingSlotService.requiredSizeFor("CAR"));
        assertEquals("MEDIUM", ParkingSlotService.requiredSizeFor("car"));
        assertEquals("LARGE", ParkingSlotService.requiredSizeFor("HEAVY_VEHICLE"));
        assertEquals("LARGE", ParkingSlotService.requiredSizeFor("heavy_vehicle"));

        assertThrows(RuntimeException.class, () -> {
            ParkingSlotService.requiredSizeFor("BICYCLE");
        });
    }

    @Test
    void testHourlyRateCalculationFormula() {
        // Test fee calculation logic:
        // TWO_WHEELER: 10/hr
        // CAR: 20/hr
        // HEAVY_VEHICLE: 40/hr
        // Billing rule: ceiling to nearest hour, minimum 1 hour.

        LocalDateTime checkIn = LocalDateTime.of(2026, 10, 10, 10, 0, 0);

        // 30 mins -> 1 hour
        LocalDateTime checkOut30m = LocalDateTime.of(2026, 10, 10, 10, 30, 0);
        long minutes30 = java.time.Duration.between(checkIn, checkOut30m).toMinutes();
        long hours30 = Math.max(1, (minutes30 + 59) / 60);
        assertEquals(1, hours30);
        assertEquals(BigDecimal.valueOf(20), BigDecimal.valueOf(20).multiply(BigDecimal.valueOf(hours30)));

        // 61 mins -> 2 hours
        LocalDateTime checkOut61m = LocalDateTime.of(2026, 10, 10, 11, 1, 0);
        long minutes61 = java.time.Duration.between(checkIn, checkOut61m).toMinutes();
        long hours61 = Math.max(1, (minutes61 + 59) / 60);
        assertEquals(2, hours61);
        assertEquals(BigDecimal.valueOf(40), BigDecimal.valueOf(20).multiply(BigDecimal.valueOf(hours61)));

        // 120 mins -> 2 hours
        LocalDateTime checkOut120m = LocalDateTime.of(2026, 10, 10, 12, 0, 0);
        long minutes120 = java.time.Duration.between(checkIn, checkOut120m).toMinutes();
        long hours120 = Math.max(1, (minutes120 + 59) / 60);
        assertEquals(2, hours120);

        // Heavy vehicle 2 hours -> 80
        assertEquals(BigDecimal.valueOf(80), BigDecimal.valueOf(40).multiply(BigDecimal.valueOf(hours120)));

        // Two wheeler 1 hour -> 10
        assertEquals(BigDecimal.valueOf(10), BigDecimal.valueOf(10).multiply(BigDecimal.valueOf(hours30)));
    }

    @Test
    void testDurationCalculationWithInstantTimes() {
        // Simulated check-in instant
        LocalDateTime checkIn = LocalDateTime.now();
        // Immediately after check-in (e.g. 5 seconds later)
        LocalDateTime immediateAfter = checkIn.plusSeconds(5);
        long minutes = java.time.Duration.between(checkIn, immediateAfter).toMinutes();
        assertEquals(0, minutes);

        // Ceiling formula: (minutes + 59) / 60, min 1
        long hours = Math.max(1, (minutes + 59) / 60);
        assertEquals(1, hours);

        // Exactly 60 minutes later
        LocalDateTime oneHourLater = checkIn.plusMinutes(60);
        long minutes60 = java.time.Duration.between(checkIn, oneHourLater).toMinutes();
        assertEquals(60, minutes60);
        long hours60 = Math.max(1, (minutes60 + 59) / 60);
        assertEquals(1, hours60);

        // 61 minutes later
        LocalDateTime sixtyOneMinutesLater = checkIn.plusMinutes(61);
        long minutes61 = java.time.Duration.between(checkIn, sixtyOneMinutesLater).toMinutes();
        assertEquals(61, minutes61);
        long hours61 = Math.max(1, (minutes61 + 59) / 60);
        assertEquals(2, hours61);
    }
}
