import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { parkingSessionService } from '../api/services';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { vehicleTitle } from '../components/VehicleCard';
import {
  formatDateTime,
  formatDuration,
  inr,
  rateFor,
} from '../utils/parking';

export default function Checkout() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(location.state?.receipt ?? null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(!!location.state?.receipt);

  useEffect(() => {
    if (receipt) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await parkingSessionService.history();
        const found = (history ?? []).find((s) => String(s.id) === String(sessionId));
        if (!cancelled) {
          if (found) setReceipt(found);
          else setError('Receipt not found for this session.');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load receipt.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [receipt, sessionId]);

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={() => navigate('/history')} />
      </div>
    );
  }
  if (!receipt) {
    return (
      <div className="page">
        <LoadingState label="Preparing receipt…" />
      </div>
    );
  }

  const v = receipt.vehicle ?? {};
  const slot = receipt.parkingSlot ?? {};
  const rows = [
    ['Vehicle', vehicleTitle(v)],
    ['Vehicle number', v.vehicleNumber ?? '—'],
    ['Parking lot', slot.parkingLot?.name ?? '—'],
    ['Bay', slot.slotNumber ?? '—'],
    ['Check-in', formatDateTime(receipt.checkInTime)],
    ['Check-out', formatDateTime(receipt.checkOutTime)],
    ['Duration', formatDuration(receipt.checkInTime, receipt.checkOutTime)],
    ['Rate', `${inr(rateFor(v.vehicleType))}/hr`],
  ];

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Session #{receipt.id} · Completed</p>
          <h1 className="page-title">Checkout receipt</h1>
          <p className="page-sub">
            {done
              ? 'Review the itemized total, then complete checkout.'
              : 'A completed parking session.'}
          </p>
        </div>
        <span className="badge badge-completed">{receipt.status}</span>
      </div>

      <div className="card card-pad">
        <dl className="receipt">
          {rows.map(([k, val]) => (
            <div className="receipt-row" key={k}>
              <dt>{k}</dt>
              <dd className={k === 'Vehicle number' ? 'mono' : ''}>{val}</dd>
            </div>
          ))}
          <div className="receipt-row receipt-total">
            <dt>Total fee</dt>
            <dd>{inr(receipt.fee)}</dd>
          </div>
        </dl>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {done ? (
            <>
              <Button block size="lg" variant="success" onClick={() => setDone(false)}>
                Complete checkout · {inr(receipt.fee)}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => navigate('/history')}>
                View history
              </Button>
              <Button onClick={() => navigate('/parking')}>Park again</Button>
            </>
          )}
        </div>
        {!done && (
          <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--green-ink)', fontWeight: 700 }}>
            ✓ Payment recorded. Thank you for parking with SmartPark.
          </p>
        )}
      </div>
    </div>
  );
}
