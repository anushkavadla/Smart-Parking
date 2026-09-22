export default function Stat({ label, value, hint, accent }) {
  return (
    <div className={`card stat${accent ? ` stat-accent-${accent}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
