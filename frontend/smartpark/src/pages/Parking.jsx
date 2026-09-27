import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  parkingLevelService,
  parkingLotService,
  parkingSessionService,
  parkingSlotService,
  vehicleService,
} from '../api/services';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import ParkingLevelSelector from '../components/ParkingLevelSelector';
import SlotLegend, { slotColor } from '../components/SlotLegend';
import { vehicleTitle } from '../components/VehicleCard';
import { rateFor, slotFitsVehicle } from '../utils/parking';
import {
  findCompatibleBay,
  getSlotLevel,
  groupSlotsByLevel,
  levelStats,
  levelTag,
  normalizeStatus,
} from '../utils/levels';

const ParkingScene = lazy(() => import('../components/ParkingScene'));

const LOT_ID = 1;
const SIZE_VEHICLE = {
  SMALL: '2 wheelers',
  MEDIUM: 'cars',
  LARGE: 'heavy vehicles',
};

export default function Parking() {
  const { activeSession } = useAuth();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [notice, setNotice] = useState('');
  const [level, setLevel] = useState('P1');
  const [prefLevel, setPrefLevel] = useState('ANY');
  const [levels, setLevels] = useState([]);
  const [availability, setAvailability] = useState(null);

  async function load() {
    setError('');
    try {
      const [lotList, slotList, vehList, active] = await Promise.all([
        parkingLotService.list(),
        parkingSlotService.byLot(LOT_ID),
        vehicleService.list(),
        activeSession(),
      ]);
      setLot((lotList ?? []).find((l) => l.id === LOT_ID) ?? lotList?.[0] ?? null);
      setSlots(slotList);
      setVehicles(vehList);
      setSession(active);
      if (!selectedId && slotList?.length) {
        const demo =
          slotList.find(
            (s) => s.slotNumber === 'A06' && s.status === 'AVAILABLE',
          ) ?? slotList.find((s) => s.status === 'AVAILABLE');
        if (demo) {
          setSelectedId(demo.id);
          setLevel(getSlotLevel(demo));
        }
      }
      if (!vehicleId && vehList?.length) setVehicleId(String(vehList[0].id));
    } catch (err) {
      setError(err.message || 'Could not load parking map.');
    }
    parkingLevelService.list().then(setLevels).catch(() => {});
    parkingSlotService.availability().then(setAvailability).catch(() => {});
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => (slots ?? []).find((s) => s.id === selectedId) ?? null,
    [slots, selectedId],
  );
  const chosenVehicle = useMemo(
    () => (vehicles ?? []).find((v) => String(v.id) === String(vehicleId)) ?? null,
    [vehicles, vehicleId],
  );
  const fits =
    selected && chosenVehicle
      ? slotFitsVehicle(selected.size, chosenVehicle.vehicleType)
      : true;
  const available = (slots ?? []).filter((s) => s.status === 'AVAILABLE');
  const grouped = useMemo(() => groupSlotsByLevel(slots), [slots]);
  const levelSlots = grouped[level] ?? [];
  const levelAvailable = levelSlots.filter((s) => s.status === 'AVAILABLE');
  const levelCounts = useMemo(() => {
    if (availability?.levels?.length) {
      const out = {};
      for (const lv of availability.levels) {
        out[lv.levelCode] = { total: lv.total, occupied: lv.occupied };
      }
      return out;
    }
    const out = {};
    for (const lv of ['P1', 'P2', 'P3']) {
      const st = levelStats(grouped[lv]);
      out[lv] = { total: st.total, occupied: st.occupied };
    }
    return out;
  }, [availability, grouped]);

  // Server-validated compatible-bay search; the local mirror runs only
  // if the request fails, and check-in is always re-validated by the
  // server, so the frontend can never approve an invalid bay alone.
  async function findParking() {
    setNotice('');
    const applyHit = (slot) => {
      const lv = getSlotLevel(slot);
      setLevel(lv);
      setSelectedId(slot.id);
      setNotice(`Best bay: ${levelTag(slot.slotNumber, lv)} (${slot.size}).`);
    };
    try {
      const slot = await parkingSlotService.find(
        chosenVehicle?.vehicleType,
        prefLevel,
      );
      if (slot?.id) {
        applyHit(slot);
        return;
      }
      throw new Error('Compatible parking slot not found');
    } catch (err) {
      const hit = findCompatibleBay(grouped, chosenVehicle?.vehicleType, prefLevel);
      if (!hit) {
        setNotice(err?.message || 'No compatible bay available. Try another level.');
        return;
      }
      applyHit(hit.slot);
    }
  }

  async function checkIn() {
    if (!chosenVehicle || !selected) return;
    setCheckingIn(true);
    setNotice('');
    try {
      const s = await parkingSessionService.checkIn(chosenVehicle.id, selected.id);
      setSession(s);
      navigate('/active');
    } catch (err) {
      setNotice(err.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  }

  if (error && !slots) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (!slots || !vehicles)
    return (
      <div className="page">
        <LoadingState label="Loading facility map…" />
      </div>
    );

  const isCurrent = selected && session?.parkingSlot?.id === selected.id;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Facility · Live map</p>
          <h1 className="page-title">{lot?.name ?? 'Smart Parking'}</h1>
          <p className="page-sub">
            {lot?.location} · {available.length} of {slots.length} bays free ·
            Small fits {SIZE_VEHICLE.SMALL}, medium fits {SIZE_VEHICLE.MEDIUM},
            large fits {SIZE_VEHICLE.LARGE}.
          </p>
        </div>
        <SlotLegend />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="scene-frame">
          <div className="scene-toolbar">
            <ParkingLevelSelector
              value={level}
              onChange={setLevel}
              stats={levelCounts}
              levels={levels}
            />
            <div className="scene-tag">
              <span className="badge badge-available">
                {level} · {levelAvailable.length} free
              </span>
              {session && (
                <span className="badge badge-active">
                  Active ·{' '}
                  {levelTag(
                    session.parkingSlot?.slotNumber,
                    getSlotLevel(session.parkingSlot),
                  )}
                </span>
              )}
            </div>
          </div>
          {levelSlots.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, padding: '24px 0' }}>
              No bays on {level} yet.
            </p>
          ) : (
            <Suspense fallback={<LoadingState label="Preparing 3D view…" />}>
              <ParkingScene
                slots={levelSlots}
                selectedId={selectedId}
                activeSlotId={session?.parkingSlot?.id ?? null}
                onSelect={(s) => {
                  setSelectedId(s.id);
                  setNotice('');
                }}
                height={520}
                level={level}
              />
            </Suspense>
          )}
          <div className="scene-hint">Drag to orbit · Scroll to zoom · Click a free bay</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <p className="eyebrow">Bay selection</p>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              {selected
                ? `Bay ${levelTag(selected.slotNumber, getSlotLevel(selected))}`
                : 'No bay selected'}
            </h2>
            {selected ? (
              <dl className="receipt" style={{ marginBottom: 14 }}>
                <div className="receipt-row">
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={`badge ${(() => {
                        if (isCurrent) return 'badge-active';
                        switch (normalizeStatus(selected.status)) {
                          case 'AVAILABLE':
                            return 'badge-available';
                          case 'RESERVED':
                            return 'badge-reserved';
                          case 'OUT_OF_SERVICE':
                            return 'badge-muted';
                          default:
                            return 'badge-occupied';
                        }
                      })()}`}
                    >
                      {isCurrent
                        ? 'Your session'
                        : normalizeStatus(selected.status).replace(/_/g, ' ')}
                    </span>
                  </dd>
                </div>
                <div className="receipt-row">
                  <dt>Size</dt>
                  <dd>{selected.size}</dd>
                </div>
                <div className="receipt-row">
                  <dt>Fits</dt>
                  <dd>{SIZE_VEHICLE[selected.size] ?? '—'}</dd>
                </div>
                <div className="receipt-row">
                  <dt>Rate</dt>
                  <dd>
                    {selected.size === 'SMALL' && '₹10/hr'}
                    {selected.size === 'MEDIUM' && '₹20/hr'}
                    {selected.size === 'LARGE' && '₹40/hr'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
                Click any free bay in the 3D view or the grid below.
              </p>
            )}

            <div className="slot-grid" role="group" aria-label={`Parking bays on ${level}`}>
              {levelSlots.map((s) => {
                const st = normalizeStatus(s.status);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={st !== 'AVAILABLE'}
                    onClick={() => {
                      setSelectedId(s.id);
                      setNotice('');
                    }}
                    className={[
                      'slot-chip',
                      s.id === selectedId ? 'selected' : '',
                      st === 'OCCUPIED' ? 'occupied' : '',
                      st === 'RESERVED' ? 'reserved' : '',
                      st === 'OUT_OF_SERVICE' ? 'oos' : '',
                      session?.parkingSlot?.id === s.id ? 'current' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      s.id === selectedId
                        ? { borderColor: slotColor(s.status, { selected: true }) }
                        : undefined
                    }
                    aria-pressed={s.id === selectedId}
                    aria-label={`Bay ${levelTag(s.slotNumber, level)}, ${s.size}, ${st}`}
                  >
                    {levelTag(s.slotNumber, level)}
                    <small>{s.size}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card card-pad">
            <p className="eyebrow">Reserve / park</p>
            {vehicles.length === 0 ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12 }}>
                  Add a vehicle before checking in.
                </p>
                <Button onClick={() => navigate('/vehicles')}>Add vehicle</Button>
              </>
            ) : session ? (
              <>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  You are parked at{' '}
                  <strong>{session.parkingSlot?.slotNumber}</strong>. Check out
                  from the live session before starting a new one.
                </p>
                <Button onClick={() => navigate('/active')}>Go to live session</Button>
              </>
            ) : (
              <>
                <div className="checkin-bar">
                  <div className="field">
                    <label className="field-label" htmlFor="park-level">
                      Preferred level
                    </label>
                    <select
                      id="park-level"
                      className="select"
                      value={prefLevel}
                      onChange={(e) => setPrefLevel(e.target.value)}
                    >
                      <option value="ANY">Any level</option>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                    </select>
                  </div>
                  <div className="field" style={{ justifyContent: 'flex-end' }}>
                    <Button
                      variant="secondary"
                      onClick={findParking}
                      disabled={!chosenVehicle}
                    >
                      Find best bay
                    </Button>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="park-vehicle">
                    Vehicle
                  </label>
                  <select
                    id="park-vehicle"
                    className="select"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {vehicleTitle(v)} · {v.vehicleNumber} · {v.vehicleType}
                      </option>
                    ))}
                  </select>
                </div>
                {!fits && selected && (
                  <div className="form-error">
                    Bay {selected.slotNumber} ({selected.size}) does not fit your{' '}
                    {(chosenVehicle?.vehicleType ?? '').toLowerCase().replace('_', ' ')}.
                    Pick a {chosenVehicle ? chosenVehicle.vehicleType === 'CAR' ? 'MEDIUM' : chosenVehicle.vehicleType === 'TWO_WHEELER' ? 'SMALL' : 'LARGE' : ''} bay.
                  </div>
                )}
                {notice && <div className="form-error">{notice}</div>}
                <Button
                  block
                  size="lg"
                  loading={checkingIn}
                  disabled={!selected || selected.status !== 'AVAILABLE' || !fits}
                  onClick={checkIn}
                >
                  {selected && selected.status === 'AVAILABLE'
                    ? `Park at ${selected.slotNumber} · ₹${chosenVehicle ? rateFor(chosenVehicle.vehicleType) : 20}/hr`
                    : 'Select a free bay'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
