import Button from './Button';

export default function EmptyState({ icon = '○', title, hint, action }) {
  return (
    <div className="empty-wrap">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <p>
        <strong>{title}</strong>
      </p>
      {hint && <p>{hint}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
