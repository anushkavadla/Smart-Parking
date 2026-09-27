/* Pure 3D facility layout math (no React, no Three.js).
 * Extracted from ParkingScene so the placement rules — one placement
 * per database slot, non-overlapping bays, lane-separated rows — are
 * unit-testable in plain Node.
 *
 * Dimensions are Three.js units (~meters). Size gaps are intentional so
 * SMALL / MEDIUM / LARGE are obvious at a glance.
 */

export const BAY_DIMS = {
  SMALL: { width: 1.4, length: 2.6 }, // two-wheeler
  MEDIUM: { width: 2.5, length: 5.0 }, // car
  LARGE: { width: 3.5, length: 7.0 }, // heavy vehicle
};

export const ZONE_ORDER = [
  { key: 'SMALL', label: 'TWO WHEELER' },
  { key: 'MEDIUM', label: 'CAR' },
  { key: 'LARGE', label: 'HEAVY VEHICLE' },
];

export const GAP_X = 0.7; // lateral gap between neighbouring bays
export const LANE = 5.4; // shared driving-lane depth between facing rows
export const ROW_GAP = 1.0; // back-to-back gap between row pairs (no lane)
export const ZONE_EXTRA = 2.2; // additional separation between size zones
export const ENTRY_D = 5.0; // entry-lane depth at the front of the level
export const ROW_MAX_WIDTH = 21; // rows wrap beyond this width (scalability)

export function sizeOf(slot) {
  const s = slot?.size;
  return s === 'SMALL' || s === 'MEDIUM' || s === 'LARGE' ? s : 'MEDIUM';
}

/* Rows stay readable no matter how many slots the backend returns:
 * SMALL → 10/row, MEDIUM → 6/row, LARGE → 5/row. */
export function perRowCap(bayW) {
  return Math.max(4, Math.floor(ROW_MAX_WIDTH / (bayW + GAP_X)));
}

/* Scalable facility layout, pure function of the slot list:
 * - slots grouped into SMALL / MEDIUM / LARGE zones (front → back)
 * - rows wrap at ROW_MAX_WIDTH and are paired back-to-back, each
 *   pair sharing one driving lane (double-loaded aisle pattern)
 * - facing rows are rotated so entrances always meet their lane
 * - duplicate slot ids collapse to a single placement (first wins),
 *   so one database slot can never render as two visual bays.
 */
export function computeLayout(slots) {
  const seen = new Set();
  const list = [...(slots ?? [])]
    .filter(Boolean)
    .filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    })
    .sort((a, b) => String(a.slotNumber).localeCompare(String(b.slotNumber)));
  const placements = [];
  const lanes = [];
  const arrows = [];
  const zones = [];
  let cursor = 0; // front boundary of the next band (we build front → back)
  let maxWidth = 6;

  const arrowsFor = (laneWidth, laneZ) => {
    const n = Math.max(1, Math.min(3, Math.floor(laneWidth / 9)));
    for (let i = 0; i < n; i++) {
      arrows.push({ x: ((i - (n - 1) / 2) * 9) || 0, z: laneZ });
    }
  };

  // Entry lane lives ahead of everything.
  cursor -= ENTRY_D;
  const entryLaneZ = cursor + ENTRY_D / 2;

  const present = ZONE_ORDER.filter((z) => list.some((s) => sizeOf(s) === z.key));

  present.forEach((zone, zi) => {
    const items = list.filter((s) => sizeOf(s) === zone.key);
    const { width: bayW, length: bayL } = BAY_DIMS[zone.key];
    const cap = perRowCap(bayW);
    const rowsNeeded = Math.max(1, Math.ceil(items.length / cap));
    const perRow = Math.ceil(items.length / rowsNeeded);
    const rows = [];
    for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

    let zoneWidth = 0;
    let zoneLaneZ = null;
    const recordLane = (z, w) => {
      lanes.push({ z, width: w });
      arrowsFor(w, z);
      if (zoneLaneZ === null) zoneLaneZ = z;
    };
    const placeRow = (rowItems, frontEdge, rot) => {
      const rowW = rowItems.length * (bayW + GAP_X) - GAP_X;
      zoneWidth = Math.max(zoneWidth, rowW);
      const cz = frontEdge - bayL / 2;
      rowItems.forEach((slot, i) => {
        placements.push({
          slot,
          x: -rowW / 2 + bayW / 2 + i * (bayW + GAP_X),
          z: cz,
          rot,
        });
      });
      return rowW;
    };

    for (let r = 0; r < rows.length; r += 2) {
      const rowB = rows[r]; // front row of the pair (noses point back)
      const rowA = rows[r + 1]; // back row (noses point forward)
      if (rowA) {
        const wB = placeRow(rowB, cursor, Math.PI);
        const laneZ = cursor - bayL - LANE / 2;
        const wA = placeRow(rowA, cursor - bayL - LANE, 0);
        const lw = Math.max(wB, wA);
        recordLane(laneZ, lw);
        cursor -= 2 * bayL + LANE;
        if (r + 2 < rows.length) cursor -= ROW_GAP;
      } else {
        // Leftover single row faces +Z and needs its own lane ahead.
        // NOTE: rowB is placed exactly once here (a previous revision
        // placed it before this branch, duplicating the whole row).
        cursor -= LANE;
        const w = placeRow(rowB, cursor, 0);
        recordLane(cursor + LANE / 2, w);
        cursor -= bayL;
      }
    }

    zones.push({ key: zone.key, label: zone.label, laneZ: zoneLaneZ });
    maxWidth = Math.max(maxWidth, zoneWidth);
    if (zi < present.length - 1) cursor -= ZONE_EXTRA;
  });

  const depth = Math.max(8, -cursor);
  const shift = depth / 2;
  placements.forEach((p) => {
    p.z += shift;
  });
  lanes.forEach((l) => {
    l.z += shift;
  });
  arrows.forEach((a) => {
    a.z += shift;
  });
  zones.forEach((z) => {
    if (z.laneZ !== null) z.laneZ += shift;
  });

  return {
    placements,
    lanes,
    arrows,
    zones,
    width: maxWidth,
    depth,
    entryLaneZ: entryLaneZ + shift,
    frontZ: depth / 2,
  };
}
