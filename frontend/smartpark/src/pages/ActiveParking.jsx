import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  parkingLevelService,
  parkingSessionService,
  parkingSlotService,
} from '../api/services';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import ParkingLevelSelector from '../components/ParkingLevelSelector';
import { vehicleTitle } from '../components/VehicleCard';
import {
  estimateFee,
  formatDateTime,
  formatElapsed,
  inr,
  rateFor,
} from '../utils/parking';
import {
  getSlotLevel,
  groupSlotsByLevel,
  levelStats,
  levelTag,
} from '../utils/levels';

const ParkingScene = lazy(() => import('../components/ParkingScene'));

export default function ActiveParking() {
  const navigate = useNavigate();

  const [actives, setActives] = useState(null);
  const [chosenId, setChosenId] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [level, setLevel] = useState(null);
  const [levels, setLevels] = useState([]);

  async function loadSlotsFor(active) {
    const lotId = active.parkingSlot?.parkingLot?.id ?? 1;
    const slotList = await parkingSlotService.byLot(lotId);
    setSlots(slotList);
    // Open the 3D view on the bay's real backend level.
    setLevel(getSlotLevel(active.parkingSlot));
  }

  async function load() {
    setError('');
    try {
      const history = await parkingSessionService.history();
      const live = (history ?? []).filter((s) => s.status === 'ACTIVE');
      setActives(live);
      const first = live[0] ?? null;
      if (first) {
        setChosenId((prev) => prev ?? first.id);
        await loadSlotsFor(live.find((s) => s.id === chosenId) ?? first);
      }
    } catch (err) {
      setError(err.message || 'Could not load live session.');
    }
    parkingLevelService.list().then(setLevels).catch(() => {});
  }

  async function switchSession(id) {
    const next = (actives ?? []).find((s) => String(s.id) === String(id));
    if (!next) return;
    setChosenId(next.id);
    setSlots(null);
    try {
      await loadSlotsFor(next);
    } catch (err) {
      setError(err.message || 'Could not load live session.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived before any hook/effect below touches it (TDZ-safe order).
  const session =
    (actives ?? []).find((s) => String(s.id) === String(chosenId)) ?? actives?.[0] ?? null;

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

  // Hooks stay above the early returns below (Rules of Hooks).
  const grouped = useMemo(() => groupSlotsByLevel(slots), [slots]);
  const levelCounts = useMemo(() => {
    const out = {};
    for (const lv of ['P1', 'P2', 'P3']) {
      const st = levelStats(grouped[lv]);
      out[lv] = { total: st.total, occupied: st.occupied };
    }
    return out;
  }, [grouped]);

  // Checkout always routes through the payment screen: nothing is
  // completed until a payment method is confirmed there.
  function goCheckout() {
    if (session) navigate(`/checkout/${session.id}`);
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (actives === null) {
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
  const viewLevel = level ?? 'P1';
  const levelSlots = grouped[viewLevel] ?? [];
  const slotLevel = getSlotLevel(slot);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            Live session · {slotLevel} · Bay {slot.slotNumber}
          </p>
          <h1 className="page-title">{vehicleTitle(v)}</h1>
          <p className="page-sub mono">
            {v.vehicleNumber} · {slot.parkingLot?.name ?? 'Smart Parking'} ·{' '}
            {levelTag(slot.slotNumber, slotLevel)}
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
          {(actives ?? []).length > 1 && (
            <div className="field" style={{ marginTop: 16, textAlign: 'left' }}>
              <label className="field-label" htmlFor="active-switch">
                Active session ({actives.length})
              </label>
              <select
                id="active-switch"
                className="select"
                value={session.id}
                onChange={(e) => switchSession(e.target.value)}
              >
                {(actives ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {vehicleTitle(s.vehicle)} ·{' '}
                    {levelTag(s.parkingSlot?.slotNumber, getSlotLevel(s.parkingSlot))}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button block size="lg" onClick={goCheckout}>
              Check out · pay
            </Button>
          </div>
        </div>

        <div className="scene-frame">
          <div className="scene-toolbar">
            <ParkingLevelSelector
              value={viewLevel}
              onChange={setLevel}
              stats={levelCounts}
              levels={levels}
            />
            <div className="scene-tag">
              <span className="badge badge-active">
                Your bay · {levelTag(slot.slotNumber, slotLevel)}
              </span>
            </div>
          </div>
          {slots && (
            <Suspense fallback={<LoadingState label="Preparing 3D view…" />}>
              <ParkingScene
                slots={levelSlots}
                selectedId={null}
                activeSlotId={slot.id}
                onSelect={() => {}}
                level={viewLevel}
              />
            </Suspense>
          )}
          <div className="scene-hint">Your vehicle is highlighted in amber</div>
        </div>
      </div>
    </div>
  );
}
