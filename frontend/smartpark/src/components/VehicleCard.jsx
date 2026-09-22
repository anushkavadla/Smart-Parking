import { TYPE_LABEL } from '../utils/parking';
import Button from './Button';

export function vehicleTitle(v) {
  const name = [v?.brand, v?.model].filter(Boolean).join(' ');
  return name || 'My vehicle';
}

export default function VehicleCard({ vehicle, onEdit, onDelete, deleting }) {
  return (
    <article className="card card-pad card-hover">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <p className="eyebrow">{TYPE_LABEL[vehicle.vehicleType] ?? vehicle.vehicleType}</p>
          <h3 style={{ fontSize: 19 }}>{vehicleTitle(vehicle)}</h3>
          <p className="mono" style={{ marginTop: 4, letterSpacing: '0.04em' }}>
            {vehicle.vehicleNumber}
          </p>
        </div>
        <span className="badge badge-muted">{vehicle.vehicleType}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {onEdit && (
          <Button variant="secondary" size="sm" onClick={() => onEdit(vehicle)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={() => onDelete(vehicle)}
          >
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}
