import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        SmartPark · Premium parking & vehicle management · Smart Parking System
      </footer>
    </div>
  );
}
