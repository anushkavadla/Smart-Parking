import { useTheme } from '../theme/ThemeContext';

export function slotColor(status, { selected, current } = {}) {
  if (current) return '#d9732b';
  if (selected) return '#3b5bdb';
  const s = String(status ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'OCCUPIED') return '#cf3f3f';
  if (s === 'RESERVED' || s === 'BOOKED') return '#ca8a04';
  if (
    s === 'OUT_OF_SERVICE' ||
    s === 'OUT_OF_ORDER' ||
    s === 'MAINTENANCE' ||
    s === 'DISABLED' ||
    s === 'INACTIVE' ||
    s === 'BLOCKED'
  ) {
    return '#6b7280';
  }
  return '#0f9d6c';
}

export default function SlotLegend() {
  const { theme } = useTheme();
  const items = [
    { label: 'Available', color: theme === 'dark' ? '#34d399' : '#0f9d6c' },
    { label: 'Occupied', color: theme === 'dark' ? '#f06666' : '#cf3f3f' },
    { label: 'Selected', color: theme === 'dark' ? '#6c8dff' : '#3b5bdb' },
    { label: 'Your session', color: theme === 'dark' ? '#f0a35c' : '#d9732b' },
    { label: 'Reserved', color: theme === 'dark' ? '#facc15' : '#ca8a04' },
    { label: 'Out of service', color: theme === 'dark' ? '#9ca3af' : '#6b7280' },
  ];
  return (
    <div className="legend" aria-label="Slot legend">
      {items.map((i) => (
        <span key={i.label}>
          <span className="legend-dot" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
