import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';

export default function Signup() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8)
      e.password = 'Password must be at least 8 characters.';
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Sign up failed. Please try again.');
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
          <h2>Your bay is waiting.</h2>
          <p>
            Create an account, register your vehicle and check in to AU Main
            Parking in under a minute.
          </p>
        </div>
        <div className="auth-brand-points">
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            One account for every vehicle you drive.
          </div>
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            Secure JWT-authenticated sessions.
          </div>
          <div className="auth-point">
            <span className="auth-point-mark">◉</span>
            Pay only for the hours you park.
          </div>
        </div>
      </div>
      <div className="auth-form-col">
        <div className="auth-card">
          <p className="eyebrow">Get started</p>
          <h1 className="page-title">Create account</h1>
          <p className="page-sub" style={{ marginBottom: 22 }}>
            Join SmartPark to park smarter on campus.
          </p>
          <form onSubmit={onSubmit} noValidate>
            {formError && <div className="form-error">{formError}</div>}
            <div className="field">
              <label className="field-label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`input${errors.name ? ' input-error' : ''}`}
                placeholder="Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
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
                autoComplete="new-password"
                className={`input${errors.password ? ' input-error' : ''}`}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className={`input${errors.confirm ? ' input-error' : ''}`}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {errors.confirm && (
                <span className="field-error">{errors.confirm}</span>
              )}
            </div>
            <Button block loading={loading} type="submit">
              Create account
            </Button>
          </form>
          <p style={{ marginTop: 18, fontSize: 14, color: 'var(--ink-soft)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
