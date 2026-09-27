import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parkingSessionService } from '../api/services';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { vehicleTitle } from '../components/VehicleCard';
import {
  formatDateTime,
  formatDuration,
  inr,
} from '../utils/parking';
import { levelTag } from '../utils/levels';

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  async function load() {
    setError('');
    try {
      setSessions(await parkingSessionService.history());
    } catch (err) {
      setError(err.message || 'Could not load history.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (sessions ?? []).filter((s) => {
      if (status !== 'ALL' && s.status !== status) return false;
      if (!q) return true;
      const hay = [
        s.vehicle?.vehicleNumber,
        s.vehicle?.brand,
        s.vehicle?.model,
        s.parkingSlot?.slotNumber,
        s.parkingSlot?.parkingLot?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sessions, query, status]);

  if (error && !sessions) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (!sessions) {
    return (
      <div className="page">
        <LoadingState label="Loading history…" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Records</p>
          <h1 className="page-title">Parking history</h1>
          <p className="page-sub">
            Every session with duration, fee and status — newest first.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="checkin-bar">
          <div className="field">
            <label className="field-label" htmlFor="hist-q">
              Search
            </label>
            <input
              id="hist-q"
              className="input"
              placeholder="Vehicle, bay, lot…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
            <label className="field-label" htmlFor="hist-status">
              Status
            </label>
            <select
              id="hist-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="≣"
            title={sessions.length === 0 ? 'No sessions yet' : 'No matches'}
            hint={
              sessions.length === 0
                ? 'Check in to Smart Parking to start your history.'
                : 'Try a different search or status filter.'
            }
            action={
              sessions.length === 0
                ? { label: 'Find parking', onClick: () => navigate('/parking') }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Lot · Bay</th>
                <th>Check-in</th>
                <th>Duration</th>
                <th>Fee</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{vehicleTitle(s.vehicle)}</strong>
                    <br />
                    <span className="mono" style={{ fontSize: 13 }}>
                      {s.vehicle?.vehicleNumber}
                    </span>
                  </td>
                  <td>
                    {s.parkingSlot?.parkingLot?.name ?? 'Smart Parking'}
                    <br />
                    <span className="mono" style={{ fontSize: 13 }}>
                      {levelTag(
                        s.parkingSlot?.slotNumber,
                        s.parkingSlot?.level?.levelCode ?? null,
                      )}
                    </span>
                  </td>
                  <td>{formatDateTime(s.checkInTime)}</td>
                  <td className="mono">
                    {formatDuration(s.checkInTime, s.checkOutTime)}
                  </td>
                  <td className="mono">{inr(s.fee)}</td>
                  <td style={{ fontSize: 13 }}>
                    {s.paymentMethod ? (
                      <>
                        <strong>{s.paymentMethod}</strong>
                        <br />
                        <span
                          className={`badge ${
                            String(s.paymentStatus ?? '').toUpperCase() === 'PAID'
                              ? 'badge-paid'
                              : 'badge-pending'
                          }`}
                          style={{ marginTop: 4 }}
                        >
                          {s.paymentStatus ?? '—'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--ink-faint)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.status === 'ACTIVE' ? 'badge-active' : 'badge-completed'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
