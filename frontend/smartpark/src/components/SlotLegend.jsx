import { useTheme } from '../theme/ThemeContext';

export function slotColor(status, { selected, current } = {}) {
  if (current) return '#d9732b';
  if (selected) return '#3b5bdb';
  if (status === 'OCCUPIED') return '#cf3f3f';
  return '#0f9d6c';
}

export default function SlotLegend() {
  const { theme } = useTheme();
  const items = [
    { label: 'Available', color: theme === 'dark' ? '#34d399' : '#0f9d6c' },
    { label: 'Occupied', color: theme === 'dark' ? '#f06666' : '#cf3f3f' },
    { label: 'Selected', color: theme === 'dark' ? '#6c8dff' : '#3b5bdb' },
    { label: 'Your session', color: theme === 'dark' ? '#f0a35c' : '#d9732b' },
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
