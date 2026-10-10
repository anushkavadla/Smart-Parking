import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseParkingTime,
  estimateFee,
  formatElapsed,
  formatDuration,
  formatDateTime,
} from './src/utils/parking.js';

describe('Parking Timezone & Time Parsing', () => {
  it('parses timestamps without timezone offset as UTC instant', () => {
    // Standard LocalDateTime format from Spring Boot Jackson
    const isoWithoutOffset = '2026-10-10T18:00:00';
    const parsed = parseParkingTime(isoWithoutOffset);
    assert.strictEqual(new Date(parsed).toISOString(), '2026-10-10T18:00:00.000Z');
    assert.notStrictEqual(formatDateTime(isoWithoutOffset), '—');

    // Space-separated database format
    const spaceSeparated = '2026-10-10 18:00:00';
    const parsedSpace = parseParkingTime(spaceSeparated);
    assert.strictEqual(new Date(parsedSpace).toISOString(), '2026-10-10T18:00:00.000Z');
  });

  it('parses timestamps with explicit timezone offsets correctly', () => {
    // Timestamp with trailing Z
    const withZ = '2026-10-10T18:00:00Z';
    assert.strictEqual(new Date(parseParkingTime(withZ)).toISOString(), '2026-10-10T18:00:00.000Z');

    // Timestamp with IST offset (+05:30)
    const withIST = '2026-10-10T23:30:00+05:30';
    assert.strictEqual(new Date(parseParkingTime(withIST)).toISOString(), '2026-10-10T18:00:00.000Z');

    // Timestamp with EDT offset (-04:00)
    const withEDT = '2026-10-10T14:00:00-04:00';
    assert.strictEqual(new Date(parseParkingTime(withEDT)).toISOString(), '2026-10-10T18:00:00.000Z');
  });

  it('calculates zero elapsed time immediately after check-in', () => {
    // Suppose check-in occurred at current instant
    const nowInstant = new Date();
    // check-in string serialized by backend in UTC
    const checkInIso = nowInstant.toISOString().replace('.000Z', '').replace('Z', '');

    const parsedStart = parseParkingTime(checkInIso);
    const elapsedMs = Math.max(0, nowInstant.getTime() - parsedStart);
    const timerDisplay = formatElapsed(elapsedMs);

    // Immediately after check-in, elapsed time must be 00:00:00, not 05:30:00!
    assert.strictEqual(timerDisplay, '00:00:00');

    // Fee estimate immediately after check-in must be 1 hour base rate
    const est = estimateFee(checkInIso, 'CAR', nowInstant);
    assert.strictEqual(est.hours, 1);
    assert.strictEqual(est.fee, 20);
  });

  it('increments timer normally as time progresses', () => {
    const baseTime = new Date('2026-10-10T18:00:00Z').getTime();
    const checkInIso = '2026-10-10T18:00:00';

    // 15 seconds elapsed
    const at15s = new Date(baseTime + 15000);
    assert.strictEqual(formatElapsed(at15s.getTime() - parseParkingTime(checkInIso)), '00:00:15');

    // 65 minutes elapsed
    const at65m = new Date(baseTime + 65 * 60 * 1000);
    assert.strictEqual(formatElapsed(at65m.getTime() - parseParkingTime(checkInIso)), '01:05:00');
    assert.strictEqual(formatDuration(checkInIso, at65m.toISOString()), '1h 5m');

    // Fee estimate at 65 minutes for CAR (2 hours * ₹20 = ₹40)
    const est = estimateFee(checkInIso, 'CAR', at65m);
    assert.strictEqual(est.hours, 2);
    assert.strictEqual(est.fee, 40);
  });
});
