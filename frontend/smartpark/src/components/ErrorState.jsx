import Button from './Button';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error-wrap" role="alert">
      <div className="error-icon" aria-hidden="true">
        ⚠
      </div>
      <p>
        <strong>Something went wrong</strong>
      </p>
      <p>{message || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
