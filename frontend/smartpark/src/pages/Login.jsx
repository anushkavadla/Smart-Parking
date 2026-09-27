import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8)
      e.password = 'Password must be at least 8 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <div>
          <p className="eyebrow" style={{ color: '#8fa0c8' }}>
            SmartPark
          </p>
          <h2>Parking that feels effortless.</h2>
          <p>
            Live availability, instant check-in and transparent per-hour
            pricing across every parking level.
          </p>
        </div>
        <div className="auth-brand-points">
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            Real-time multi-level slot map with 3D visualization.
          </div>
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            Per-hour billing by vehicle class — two-wheeler, car, heavy.
          </div>
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            Full session history and itemized checkout receipts.
          </div>
        </div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h1 className="page-title">Sign in</h1>
          <p className="page-sub" style={{ marginBottom: 22 }}>
            Access your vehicles, live sessions and parking history.
          </p>
          <form onSubmit={onSubmit} noValidate>
            {formError && <div className="form-error">{formError}</div>}
            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input${errors.email ? ' input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`input${errors.password ? ' input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>
            <Button block loading={loading} type="submit">
              Sign in
            </Button>
          </form>
          <p style={{ marginTop: 18, fontSize: 14, color: 'var(--ink-soft)' }}>
            New to SmartPark? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
