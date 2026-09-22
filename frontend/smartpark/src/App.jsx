import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './layouts/Layout';
import ActiveParking from './pages/ActiveParking';
import Checkout from './pages/Checkout';
import History from './pages/History';
import Home from './pages/Home';
import Login from './pages/Login';
import Parking from './pages/Parking';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import Vehicles from './pages/Vehicles';

function Guard({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Guard>
                <Home />
              </Guard>
            }
          />
          <Route
            path="/parking"
            element={
              <Guard>
                <Parking />
              </Guard>
            }
          />
          <Route
            path="/active"
            element={
              <Guard>
                <ActiveParking />
              </Guard>
            }
          />
          <Route
            path="/checkout/:sessionId"
            element={
              <Guard>
                <Checkout />
              </Guard>
            }
          />
          <Route
            path="/vehicles"
            element={
              <Guard>
                <Vehicles />
              </Guard>
            }
          />
          <Route
            path="/history"
            element={
              <Guard>
                <History />
              </Guard>
            }
          />
          <Route
            path="/profile"
            element={
              <Guard>
                <Profile />
              </Guard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
