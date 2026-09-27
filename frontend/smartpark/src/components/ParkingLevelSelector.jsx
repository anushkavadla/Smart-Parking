import { LEVELS } from '../utils/levels';

/* Segmented level control with live per-level occupancy.
 * Props: value ('P1'), onChange(level), stats { P1: {total, occupied}, … },
 * levels (optional real backend levels [{levelCode, name, …}]; falls back
 * to P1/P2/P3 when the list has not loaded yet). */
export default function ParkingLevelSelector({ value, onChange, stats, levels }) {
  const rows = (levels?.length
    ? levels
    : LEVELS.map((levelCode) => ({ levelCode }))
  ).map((lv) => (typeof lv === 'string' ? { levelCode: lv } : lv));
  return (
    <div className="level-seg" role="group" aria-label="Parking level">
      <span className="level-seg-title">Parking level</span>
      <div className="level-seg-btns">
        {rows.map((lv) => {
          const code = lv.levelCode;
          const st = stats?.[code] ?? { total: 0, occupied: 0 };
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange?.(code)}
              aria-pressed={active}
              title={lv.name ?? code}
              className={['level-seg-btn', active ? 'active' : ''].filter(Boolean).join(' ')}
            >
              <strong>{code}</strong>
              <small>
                {st.occupied}/{st.total} occupied
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
