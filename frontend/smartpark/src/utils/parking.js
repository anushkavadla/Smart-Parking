/* Helpers that mirror backend business rules (documented, not duplicated logic):
   - Slot sizes: SMALL → TWO_WHEELER, MEDIUM → CAR, LARGE → HEAVY_VEHICLE
   - Rates (per hour): TWO_WHEELER 10, CAR 20, HEAVY_VEHICLE 40; min 1 hour, ceil. */

export const SIZE_FOR_TYPE = {
  TWO_WHEELER: 'SMALL',
  CAR: 'MEDIUM',
  HEAVY_VEHICLE: 'LARGE',
};

export const RATE_FOR_TYPE = {
  TWO_WHEELER: 10,
  CAR: 20,
  HEAVY_VEHICLE: 40,
};

export const TYPE_LABEL = {
  TWO_WHEELER: 'Two-wheeler',
  CAR: 'Car',
  HEAVY_VEHICLE: 'Heavy vehicle',
};

export function slotFitsVehicle(slotSize, vehicleType) {
  if (!slotSize || !vehicleType) return false;
  return (
    String(slotSize).toUpperCase() ===
    SIZE_FOR_TYPE[String(vehicleType).toUpperCase()]
  );
}

export function rateFor(vehicleType) {
  return RATE_FOR_TYPE[String(vehicleType ?? '').toUpperCase()] ?? 20;
}

export function parseParkingTime(value) {
  if (!value) return NaN;

  let str = String(value).trim().replace(' ', 'T');
  // If the timestamp does not already include a timezone indicator ('Z' or [+-]HH[:MM]),
  // treat it as UTC instant from the backend (standard for LocalDateTime in JSON).
  if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(str)) {
    str += 'Z';
  }
  return new Date(str).getTime();
}
export function estimateFee(checkInIso, vehicleType, now = new Date()) {
  const start = parseParkingTime(checkInIso);
  if (!Number.isFinite(start)) {
    return { hours: 1, fee: rateFor(vehicleType) };
  }

  const mins = Math.max(0, (now.getTime() - start) / 60000);
  const hours = Math.max(1, Math.ceil(mins / 60));

  return { hours, fee: hours * rateFor(vehicleType) };
}

export function formatDateTime(iso) {
  const t = parseParkingTime(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(checkInIso, checkOutIso) {
  const start = parseParkingTime(checkInIso);
  if (!Number.isFinite(start)) return '—';
  const end = checkOutIso ? parseParkingTime(checkOutIso) : Date.now();
  if (!Number.isFinite(end)) return '—';
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function inr(amount) {
  const n = Number(amount ?? 0);
  return `₹${n.toFixed(2)}`;
}
