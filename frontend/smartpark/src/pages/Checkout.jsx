import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parkingSessionService } from '../api/services';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { vehicleTitle } from '../components/VehicleCard';
import {
  estimateFee,
  formatDateTime,
  formatDuration,
  inr,
  rateFor,
} from '../utils/parking';
import { levelCodeOf, levelTag } from '../utils/levels';

const METHODS = [
  { id: 'UPI', title: 'UPI', hint: 'GPay · PhonePe · Paytm' },
  { id: 'CARD', title: 'Card', hint: 'Credit / debit card' },
  { id: 'CASH', title: 'Cash', hint: 'Pay at the exit' },
];

function paymentBadge(status) {
  const s = String(status ?? '').toUpperCase();
  if (s === 'PAID') return 'badge-paid';
  if (s === 'PENDING') return 'badge-pending';
  if (s === 'FAILED' || s === 'CANCELLED') return 'badge-failed';
  return 'badge-muted';
}

export default function Checkout() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null); // ACTIVE session → pay view
  const [receipt, setReceipt] = useState(null); // COMPLETED session → receipt
  const [error, setError] = useState('');
  const [method, setMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  // Simulated payment-form fields. Validated locally only and NEVER
  // sent to (or stored by) the backend — only paymentMethod travels.
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const history = await parkingSessionService.history();
        const found = (history ?? []).find((s) => String(s.id) === String(sessionId));
        if (cancelled) return;
        if (!found) {
          setError('Receipt not found for this session.');
          return;
        }
        if (found.status === 'ACTIVE') setSession(found);
        else setReceipt(found);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load checkout.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Live estimate while the meter is still running.
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

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={() => navigate('/history')} />
      </div>
    );
  }
  if (!session && !receipt) {
    return (
      <div className="page">
        <LoadingState label="Preparing checkout…" />
      </div>
    );
  }

  if (receipt) return <ReceiptView receipt={receipt} />;

  const v = session.vehicle ?? {};
  const slot = session.parkingSlot ?? {};
  const slotLevel = levelCodeOf(slot) ?? '—';

  function validateForm() {
    if (method === 'UPI') {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        return 'Enter a valid UPI ID (e.g. driver@okbank).';
      }
    }
    if (method === 'CARD') {
      const digits = card.number.replace(/\D/g, '');
      if (digits.length !== 16) return 'Card number must be 16 digits.';
      const m = card.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!m) return 'Expiry must be MM/YY.';
      const exp = new Date(2000 + Number(m[2]), Number(m[1]));
      if (exp <= new Date()) return 'Card expiry must be in the future.';
      if (!/^\d{3,4}$/.test(card.cvv)) return 'CVV must be 3–4 digits.';
      if (!card.name.trim()) return 'Enter the name on the card.';
    }
    return '';
  }

  async function pay() {
    const formError = validateForm();
    if (formError) {
      setPayError(formError);
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      // Only the method travels. Card/UPI details stay in the browser
      // (simulation) and are never stored server-side.
      const done = await parkingSessionService.checkOut(session.id, {
        paymentMethod: method,
      });
      setSession(null);
      setReceipt(done);
    } catch (err) {
      // Server rejected payment BEFORE completing anything: the session
      // is still ACTIVE and the bay still OCCUPIED — safe to retry.
      setPayError(err.message || 'Payment failed. The session is still active.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Session #{session.id} · Payment due</p>
          <h1 className="page-title">Checkout</h1>
          <p className="page-sub">
            {vehicleTitle(v)} · {levelTag(slot.slotNumber, slotLevel)} — pay to
            complete the session and free the bay.
          </p>
        </div>
        <span className="badge badge-pending">Unpaid</span>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <p className="eyebrow">Amount due</p>
        <div className="timer-display" style={{ fontSize: 40 }}>
          {inr(est?.fee)}
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6 }}>
          {formatDuration(session.checkInTime, new Date(now).toISOString())} parked ·{' '}
          {inr(rateFor(v.vehicleType))}/hr · final total is calculated at payment.
        </p>
      </div>

      <div className="card card-pad">
        <p className="eyebrow">Payment method (simulated)</p>
        <div className="pay-methods" role="group" aria-label="Payment method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMethod(m.id);
                setPayError('');
              }}
              aria-pressed={method === m.id}
              className={['pay-method', method === m.id ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <strong>{m.title}</strong>
              <small>{m.hint}</small>
            </button>
          ))}
        </div>

        {method === 'UPI' && (
          <div className="field">
            <label className="field-label" htmlFor="pay-upi">
              UPI ID
            </label>
            <input
              id="pay-upi"
              className="input mono"
              placeholder="driver@okbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        {method === 'CARD' && (
          <>
            <div className="field">
              <label className="field-label" htmlFor="pay-card-num">
                Card number
              </label>
              <input
                id="pay-card-num"
                className="input mono"
                placeholder="4111 1111 1111 1111"
                inputMode="numeric"
                value={card.number}
                onChange={(e) =>
                  setCard({
                    ...card,
                    number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19),
                  })
                }
                autoComplete="off"
              />
            </div>
            <div className="checkin-bar">
              <div className="field">
                <label className="field-label" htmlFor="pay-card-exp">
                  Expiry
                </label>
                <input
                  id="pay-card-exp"
                  className="input mono"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 5) })}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="pay-card-cvv">
                  CVV
                </label>
                <input
                  id="pay-card-cvv"
                  className="input mono"
                  placeholder="•••"
                  inputMode="numeric"
                  type="password"
                  value={card.cvv}
                  onChange={(e) =>
                    setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })
                  }
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="pay-card-name">
                Name on card
              </label>
              <input
                id="pay-card-name"
                className="input"
                placeholder="Full name"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                autoComplete="off"
              />
            </div>
          </>
        )}

        {method === 'CASH' && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            Pay {inr(est?.fee)} in cash at the exit. Confirming marks the
            payment as completed.
          </p>
        )}

        {payError && <div className="form-error">{payError}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => navigate('/active')}>
            Back
          </Button>
          <Button block size="lg" variant="success" loading={paying} onClick={pay}>
            Pay {inr(est?.fee)} · {method}
          </Button>
        </div>

        <div className="pay-secure-note">
          <span aria-hidden="true">🔒</span>
          <span>
            Simulation only — no real money moves. Card and UPI details never
            leave this page and are never stored.
          </span>
        </div>
      </div>
    </div>
  );
}

function ReceiptView({ receipt }) {
  const navigate = useNavigate();
  const v = receipt.vehicle ?? {};
  const slot = receipt.parkingSlot ?? {};
  const slotLevel = levelCodeOf(slot) ?? '—';
  const paid = String(receipt.paymentStatus ?? '').toUpperCase() === 'PAID';
  const rows = [
    ['Vehicle', vehicleTitle(v)],
    ['Vehicle number', v.vehicleNumber ?? '—'],
    ['Parking facility', slot.parkingLot?.name ?? 'Smart Parking System'],
    ['Level', slotLevel],
    ['Slot', levelTag(slot.slotNumber, slotLevel === '—' ? null : slotLevel)],
    ['Check-in', formatDateTime(receipt.checkInTime)],
    ['Check-out', formatDateTime(receipt.checkOutTime)],
    ['Duration', formatDuration(receipt.checkInTime, receipt.checkOutTime)],
    ['Rate', `${inr(rateFor(v.vehicleType))}/hr`],
    ['Parking fee', inr(receipt.fee)],
    ['Payment method', receipt.paymentMethod ?? '—'],
    [
      'Payment status',
      <span key="ps" className={`badge ${paymentBadge(receipt.paymentStatus)}`}>
        {receipt.paymentStatus ?? '—'}
      </span>,
    ],
    ['Reference', receipt.paymentReference ?? '—'],
  ];

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Session #{receipt.id} · Completed</p>
          <h1 className="page-title">Checkout receipt</h1>
          <p className="page-sub">A completed parking session.</p>
        </div>
        <span className="badge badge-completed">{receipt.status}</span>
      </div>

      <div className="card card-pad">
        <dl className="receipt">
          {rows.map(([k, val]) => (
            <div className="receipt-row" key={k}>
              <dt>{k}</dt>
              <dd className={k === 'Vehicle number' || k === 'Reference' ? 'mono' : ''}>
                {val}
              </dd>
            </div>
          ))}
          <div className="receipt-row receipt-total">
            <dt>Total paid</dt>
            <dd>{inr(receipt.fee)}</dd>
          </div>
        </dl>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            View history
          </Button>
          <Button onClick={() => navigate('/parking')}>Park again</Button>
        </div>
        {paid && (
          <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--green-ink)', fontWeight: 700 }}>
            ✓ Payment of {inr(receipt.fee)} via {receipt.paymentMethod} completed.
            Thank you for parking with SmartPark.
          </p>
        )}
      </div>
    </div>
  );
}
