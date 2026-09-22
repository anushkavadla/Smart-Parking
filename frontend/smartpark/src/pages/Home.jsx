import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  parkingLotService,
  parkingSessionService,
  parkingSlotService,
  vehicleService,
} from '../api/services';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import SlotLegend from '../components/SlotLegend';
import Stat from '../components/Stat';
import { vehicleTitle } from '../components/VehicleCard';
import { rateFor, slotFitsVehicle } from '../utils/parking';

const ParkingScene = lazy(() => import('../components/ParkingScene'));

const LOT_ID = 1;

export default function Home() {
  const { user, activeSession } = useAuth();
  const navigate = useNavigate();

  const [lots, setLots] = useState(null);
  const [slots, setSlots] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [notice, setNotice] = useState('');

  async function load() {
    setError('');
    try {
      const [lotList, slotList, vehList, active] = await Promise.all([
        parkingLotService.list(),
        parkingSlotService.byLot(LOT_ID),
        vehicleService.list(),
        activeSession(),
      ]);
      setLots(lotList);
      setSlots(slotList);
      setVehicles(vehList);
      setSession(active);
      if (!selectedId && slotList?.length) {
        // Demonstration default: A06 when it is free, else first free bay.
        const demo =
          slotList.find(
            (s) => s.slotNumber === 'A06' && s.status === 'AVAILABLE',
          ) ?? slotList.find((s) => s.status === 'AVAILABLE');
        if (demo) setSelectedId(demo.id);
      }
      if (!vehicleId && vehList?.length) setVehicleId(String(vehList[0].id));
    } catch (err) {
      setError(err.message || 'Could not load dashboard.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lot = useMemo(
    () => (lots ?? []).find((l) => l.id === LOT_ID) ?? lots?.[0],
    [lots],
  );
  const available = (slots ?? []).filter((s) => s.status === 'AVAILABLE');
  const occupied = (slots ?? []).filter((s) => s.status === 'OCCUPIED');
  const selected = (slots ?? []).find((s) => s.id === selectedId) ?? null;
  const chosenVehicle =
    (vehicles ?? []).find((v) => String(v.id) === String(vehicleId)) ?? null;
  const fits =
    selected && chosenVehicle
      ? slotFitsVehicle(selected.size, chosenVehicle.vehicleType)
      : true;

  async function checkIn() {
    if (!chosenVehicle || !selected) return;
    setCheckingIn(true);
    setNotice('');
    try {
      const s = await parkingSessionService.checkIn(
        chosenVehicle.id,
        selected.id,
      );
      setSession(s);
      const fresh = await parkingSlotService.byLot(LOT_ID);
      setSlots(fresh);
      setNotice(`Checked in to ${selected.slotNumber}. Enjoy your stay.`);
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
  if (!slots || !vehicles) return <div className="page"><LoadingState label="Loading live parking data…" /></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">SmartPark · Live</p>
          <h1 className="page-title">
            Good day{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="page-sub">
            {lot?.name ?? 'AU Main Parking'}
            {lot ? ` · ${lot.location}` : ''} — select a bay in the 3D view
            and check in with one tap.
          </p>
        </div>
        <div className="hero-actions">
          <Button variant="secondary" onClick={() => navigate('/parking')}>
            Find parking
          </Button>
          {session ? (
            <Button onClick={() => navigate('/active')}>Active parking</Button>
          ) : (
            <Button onClick={() => navigate('/vehicles')}>
              My vehicles
            </Button>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <Stat
          label="Available"
          value={available.length}
          hint={`of ${slots.length} bays`}
          accent="green"
        />
        <Stat
          label="Occupied"
          value={occupied.length}
          hint="live from facility"
          accent="red"
        />
        <Stat
          label="Car rate"
          value="₹20/hr"
          hint="2W ₹10 · Heavy ₹40"
          accent="blue"
        />
        <Stat
          label="Your vehicle"
          value={chosenVehicle ? vehicleTitle(chosenVehicle) : '—'}
          hint={chosenVehicle?.vehicleNumber ?? 'add one to begin'}
        />
      </div>

      <div className="hero">
        <div className="card card-pad hero-copy">
          <p className="eyebrow">Quick check-in</p>
          {vehicles.length === 0 ? (
            <EmptyState
              icon="▣"
              title="No vehicles yet"
              hint="Register your first vehicle to start parking."
              action={{
                label: 'Add vehicle',
                onClick: () => navigate('/vehicles'),
              }}
            />
          ) : session ? (
            <>
              <h2 style={{ fontSize: 22 }}>
                Parked at {session.parkingSlot?.slotNumber}
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
                {vehicleTitle(session.vehicle)} · {session.vehicle?.vehicleNumber} — a
                live session is running.
              </p>
              <div className="hero-actions">
                <Button onClick={() => navigate('/active')}>View live session</Button>
                <Button variant="secondary" onClick={() => navigate('/parking')}>
                  Change view
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="checkin-bar">
                <div className="field">
                  <label className="field-label" htmlFor="home-vehicle">
                    Vehicle
                  </label>
                  <select
                    id="home-vehicle"
                    className="select"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {vehicleTitle(v)} · {v.vehicleNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="home-slot">
                    Bay
                  </label>
                  <select
                    id="home-slot"
                    className="select"
                    value={selectedId ?? ''}
                    onChange={(e) => setSelectedId(Number(e.target.value))}
                  >
                    {available.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.slotNumber} · {s.size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selected && (
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  Bay <strong>{selected.slotNumber}</strong> ({selected.size}) ·{' '}
                  {chosenVehicle
                    ? `₹${rateFor(chosenVehicle.vehicleType)}/hr for your ${chosenVehicle.vehicleType.toLowerCase().replace('_', ' ')}`
                    : ''}
                  {!fits && (
                    <span style={{ color: 'var(--red-ink)', fontWeight: 700 }}>
                      {' '}— this bay does not fit your vehicle.
                    </span>
                  )}
                </p>
              )}
              <div className="hero-actions">
                <Button
                  size="lg"
                  loading={checkingIn}
                  disabled={!selected || !chosenVehicle || !fits}
                  onClick={checkIn}
                >
                  Check in{selected ? ` to ${selected.slotNumber}` : ''}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/parking')}>
                  Open full map →
                </Button>
              </div>
              {notice && (
                <p style={{ fontSize: 13.5, fontWeight: 600 }}>{notice}</p>
              )}
            </>
          )}
        </div>

        <div className="scene-frame">
          <div className="scene-tag">
            <span className="badge badge-available">
              {available.length} free
            </span>
            {session && (
              <span className="badge badge-active">
                Active · {session.parkingSlot?.slotNumber}
              </span>
            )}
          </div>
          <Suspense fallback={<LoadingState label="Preparing 3D view…" />}>
            <ParkingScene
              slots={slots}
              selectedId={selectedId}
              activeSlotId={session?.parkingSlot?.id ?? null}
              onSelect={(s) => setSelectedId(s.id)}
            />
          </Suspense>
          <div className="scene-hint">Drag to orbit · Scroll to zoom · Click a free bay</div>
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <SlotLegend />
      </div>
    </div>
  );
}
