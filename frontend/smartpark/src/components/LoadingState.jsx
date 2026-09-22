export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <div className="loading-ring" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
