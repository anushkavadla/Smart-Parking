import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  parkingSessionService,
  parkingSlotService,
} from '../api/services';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { vehicleTitle } from '../components/VehicleCard';
import {
  estimateFee,
  formatDateTime,
  formatElapsed,
  inr,
  rateFor,
} from '../utils/parking';

const ParkingScene = lazy(() => import('../components/ParkingScene'));

export default function ActiveParking() {
  const { activeSession } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [checkingOut, setCheckingOut] = useState(false);
  const [notice, setNotice] = useState('');

  async function load() {
    setError('');
    try {
      const active = await activeSession();
      setSession(active);
      if (active) {
        const lotId = active.parkingSlot?.parkingLot?.id ?? 1;
        setSlots(await parkingSlotService.byLot(lotId));
      }
    } catch (err) {
      setError(err.message || 'Could not load live session.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session]);

  const est = useMemo(
    () =>
      session
        ? estimateFee(session.checkInTime, session.vehicle?.vehicleType, new Date(now))
        : null,
    [session, now],
  );

  async function checkOut() {
    if (!session) return;
    setCheckingOut(true);
    setNotice('');
    try {
      const done = await parkingSessionService.checkOut(session.id);
      navigate(`/checkout/${done.id}`, { state: { receipt: done } });
    } catch (err) {
      setNotice(err.message || 'Checkout failed.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (session === null && slots === null) {
    return (
      <div className="page">
        <LoadingState label="Checking live session…" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <p className="eyebrow">Live session</p>
            <h1 className="page-title">Active parking</h1>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon="◍"
            title="No active session"
            hint="You are not parked right now. Pick a bay and check in."
            action={{ label: 'Find parking', onClick: () => navigate('/parking') }}
          />
        </div>
      </div>
    );
  }

  const v = session.vehicle ?? {};
  const slot = session.parkingSlot ?? {};

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Live session · Bay {slot.slotNumber}</p>
          <h1 className="page-title">{vehicleTitle(v)}</h1>
          <p className="page-sub mono">
            {v.vehicleNumber} · {slot.parkingLot?.name} · Bay {slot.slotNumber}
          </p>
        </div>
        <span className="badge badge-active">Active</span>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Elapsed</p>
          <div className="timer-display" aria-live="off">
            {formatElapsed(now - new Date(session.checkInTime).getTime())}
          </div>
          <dl className="receipt" style={{ marginTop: 20, textAlign: 'left' }}>
            <div className="receipt-row">
              <dt>Check-in</dt>
              <dd>{formatDateTime(session.checkInTime)}</dd>
            </div>
            <div className="receipt-row">
              <dt>Rate</dt>
              <dd>{inr(rateFor(v.vehicleType))}/hr</dd>
            </div>
            <div className="receipt-row receipt-total">
              <dt>Estimated fee</dt>
              <dd>
                {inr(est?.fee)} <small>({est?.hours}h)</small>
              </dd>
            </div>
          </dl>
          {notice && <div className="form-error" style={{ marginTop: 12 }}>{notice}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button block size="lg" loading={checkingOut} onClick={checkOut}>
              Check out
            </Button>
          </div>
        </div>

        <div className="scene-frame">
          <div className="scene-tag">
            <span className="badge badge-active">Your bay · {slot.slotNumber}</span>
          </div>
          {slots && (
            <Suspense fallback={<LoadingState label="Preparing 3D view…" />}>
              <ParkingScene
                slots={slots}
                selectedId={null}
                activeSlotId={slot.id}
                onSelect={() => {}}
              />
            </Suspense>
          )}
          <div className="scene-hint">Your vehicle is highlighted in amber</div>
        </div>
      </div>
    </div>
  );
}
