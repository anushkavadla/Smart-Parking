import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import LoadingState from '../components/LoadingState';

export default function ProtectedRoute({ children }) {
  const { ready } = useAuth();
  const location = useLocation();

  if (!ready) return <LoadingState label="Restoring session…" />;
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
