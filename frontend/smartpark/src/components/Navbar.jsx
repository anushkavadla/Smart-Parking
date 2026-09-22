import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getToken } from '../api/client';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/parking', label: 'Parking' },
  { to: '/active', label: 'Active Parking' },
  { to: '/vehicles', label: 'My Vehicles' },
  { to: '/history', label: 'History' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  const initial = (user?.name ?? user?.email ?? 'S').trim().charAt(0).toUpperCase();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand" aria-label="SmartPark home">
          <span className="brand-mark">P</span>
          SmartPark
        </Link>
        {authed && (
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="nav-spacer" />
        <ThemeToggle />
        {authed ? (
          <div className="nav-user">
            <span className="avatar" aria-hidden="true">
              {initial}
            </span>
            <span>{user?.name ?? user?.email ?? 'Driver'}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm nav-cta">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
