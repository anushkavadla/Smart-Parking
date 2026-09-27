/* Multi-level parking helpers.
 *
 * BACKEND SOURCE OF TRUTH: levels, slot existence, status, size and
 * vehicle compatibility all come from the API. Every slot carries its
 * real level (`slot.level.levelCode`, e.g. "P1") since the backend
 * ParkingLevel entity was introduced — no frontend-generated levels.
 */

export const LEVELS = ['P1', 'P2', 'P3'];

/* Full status vocabulary (the backend emits AVAILABLE / OCCUPIED /
 * RESERVED / OUT_OF_SERVICE; anything else renders safely gray). */
export const STATUS_META = {
  AVAILABLE: { label: 'Available', color: '#22c55e', parkable: true },
  OCCUPIED: { label: 'Occupied', color: '#ef4444', parkable: false },
  RESERVED: { label: 'Reserved', color: '#eab308', parkable: false },
  OUT_OF_SERVICE: { label: 'Out of service', color: '#6b7280', parkable: false },
  UNKNOWN: { label: 'Unknown', color: '#6b7280', parkable: false },
};

export function normalizeStatus(status) {
  const s = String(status ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'AVAILABLE') return 'AVAILABLE';
  if (s === 'OCCUPIED') return 'OCCUPIED';
  if (s === 'RESERVED' || s === 'BOOKED') return 'RESERVED';
  if (
    s === 'OUT_OF_SERVICE' ||
    s === 'OUT_OF_ORDER' ||
    s === 'MAINTENANCE' ||
    s === 'DISABLED' ||
    s === 'INACTIVE' ||
    s === 'BLOCKED'
  ) {
    return 'OUT_OF_SERVICE';
  }
  return 'UNKNOWN';
}

export function isParkableSlot(slot) {
  return normalizeStatus(slot?.status) === 'AVAILABLE';
}

/* Accepts 1/2/3, "P1", "Level 1", "Floor 2", … → "P1"/"P2"/"P3" | null */
export function normalizeLevel(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value >= 1 && value <= 3 ? `P${value}` : null;
  }
  const m = String(value).match(/(?:^|\D)([123])(?:\D|$)/);
  return m ? `P${m[1]}` : null;
}

/* "P1-M04" / "P2_M04" / "P3:M04" → "P1"/"P2"/"P3" | null. Prefixes are
 * real backend data (the seeder numbers bays this way), never invented. */
export function levelFromSlotNumber(slotNumber) {
  const m = String(slotNumber ?? '').match(/^P([123])[\-_\s:]?/i);
  return m ? `P${m[1]}` : null;
}

/* The slot's real backend level. Priority: joined level object, flat
 * levelCode field, slot-number prefix. Last-resort display default is
 * P1 and is only reachable with hand-made data outside the API. */
export function levelCodeOf(slot) {
  return (
    slot?.level?.levelCode ??
    slot?.levelCode ??
    levelFromSlotNumber(slot?.slotNumber) ??
    null
  );
}

export function getSlotLevel(slot) {
  return levelCodeOf(slot) ?? 'P1';
}

/* Slots grouped by their real backend level code. P1/P2/P3 keys always
 * exist (possibly empty) so selectors never break on sparse data. */
export function groupSlotsByLevel(slots) {
  const groups = { P1: [], P2: [], P3: [] };
  for (const slot of (slots ?? []).filter(Boolean)) {
    const code = levelCodeOf(slot);
    if (code && !groups[code]) groups[code] = [];
    (groups[code ?? 'P1'] ?? groups.P1).push(slot);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) =>
      String(a.slotNumber).localeCompare(String(b.slotNumber)),
    );
  }
  return groups;
}

/* Display tag for a bay, e.g. "P1-M04". Never double-prefixes a slot
 * number that already carries its level ("P1-M04" stays as-is). */
export function levelTag(slotNumber, level) {
  const raw = String(slotNumber ?? '');
  if (levelFromSlotNumber(raw)) return raw;
  return level ? `${level}-${raw}` : raw;
}

export function levelStats(slots) {
  const stats = { total: 0, available: 0, occupied: 0, reserved: 0, outOfService: 0 };
  for (const slot of slots ?? []) {
    if (!slot) continue;
    stats.total += 1;
    switch (normalizeStatus(slot.status)) {
      case 'AVAILABLE':
        stats.available += 1;
        break;
      case 'OCCUPIED':
        stats.occupied += 1;
        break;
      case 'RESERVED':
        stats.reserved += 1;
        break;
      case 'OUT_OF_SERVICE':
      default:
        stats.outOfService += 1;
        break;
    }
  }
  return stats;
}

/* Client-side fallback for compatible-bay search (mirrors the backend
 * /find rules). Pages prefer the server API; this runs only if the
 * request fails, and check-in is always re-validated server-side. */
export function findCompatibleBay(grouped, vehicleType, level = 'ANY') {
  const need = { TWO_WHEELER: 'SMALL', CAR: 'MEDIUM', HEAVY_VEHICLE: 'LARGE' }[
    String(vehicleType ?? '').toUpperCase()
  ];
  if (!need) return null;
  const order = level === 'ANY' ? LEVELS : [level];
  for (const lv of order) {
    const hit = (grouped?.[lv] ?? []).find(
      (s) => normalizeStatus(s.status) === 'AVAILABLE' && String(s.size).toUpperCase() === need,
    );
    if (hit) return { slot: hit, level: lv };
  }
  return null;
}
