import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { userService, vehicleService } from '../api/services';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import Stat from '../components/Stat';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../theme/ThemeContext';
import { inr } from '../utils/parking';
import { parkingSessionService } from '../api/services';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [counts, setCounts] = useState({ vehicles: 0, sessions: 0, spent: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, vehicles, sessions] = await Promise.all([
          userService.list(),
          vehicleService.list(),
          parkingSessionService.history(),
        ]);
        if (cancelled) return;
        const mine =
          (users ?? []).find(
            (u) => u.email === user?.email,
          ) ?? { name: user?.name, email: user?.email };
        setMe(mine);
        setCounts({
          vehicles: (vehicles ?? []).length,
          sessions: (sessions ?? []).length,
          spent: (sessions ?? []).reduce((t, s) => t + Number(s.fee ?? 0), 0),
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load profile.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!me) {
    return (
      <div className="page">
        <LoadingState label="Loading profile…" />
      </div>
    );
  }

  const initial = (me.name ?? me.email ?? 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
            {initial}
          </span>
          <div>
            <h2 style={{ fontSize: 22 }}>{me.name ?? 'Driver'}</h2>
            <p style={{ color: 'var(--ink-soft)' }}>{me.email}</p>
          </div>
        </div>
        <div className="grid-3" style={{ marginTop: 20 }}>
          <Stat label="Vehicles" value={counts.vehicles} />
          <Stat label="Sessions" value={counts.sessions} />
          <Stat label="Total spent" value={inr(counts.spent)} accent="green" />
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: 16 }}>Appearance</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Current theme: {theme === 'light' ? 'Light' : 'Dark'}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
