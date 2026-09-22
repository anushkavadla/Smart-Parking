import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Parking from "./pages/Parking";
import CheckOut from "./pages/CheckOut";
import MyVehicles from "./pages/MyVehicles";

import "./App.css";

function Home() {
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState("A06");
  const [showParking, setShowParking] = useState(false);

  const slots = [
    { id: "A01", status: "available" },
    { id: "A02", status: "available" },
    { id: "A03", status: "occupied" },
    { id: "A04", status: "available" },
    { id: "A05", status: "available" },
    { id: "A06", status: "selected" },
    { id: "A07", status: "available" },
    { id: "A08", status: "available" },
    { id: "A09", status: "available" },
    { id: "A10", status: "available" },
  ];

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">P</span>
          <span>SmartPark</span>
          <span className="live-dot">● LIVE</span>
        </div>

        <nav>
          <a
            className="active"
            onClick={() => navigate("/")}
          >
            Home
          </a>

          <a onClick={() => navigate("/vehicles")}>
            My Vehicles
          </a>

          <a onClick={() => navigate("/parking")}>
            Parking
          </a>

          <a onClick={() => navigate("/checkout")}>
            Active Parking
          </a>

          <a onClick={() => navigate("/checkout")}>
            History
          </a>

          <a>
            Profile
          </a>
        </nav>

        <div className="profile">
          <span>10:42 AM</span>
          <span className="avatar">A</span>
        </div>
      </header>

      <main>

        {/* WELCOME */}
        <section className="welcome">
          <div>
            <div className="tiny-label">
              SMART PARKING • TODAY
            </div>

            <h1>
              Good evening! <span>👋</span>
            </h1>

            <p>
              Ready to find your spot?
            </p>
          </div>

          <div className="status">
            <span className="available-pill">
              <i></i>
              9 SPOTS AVAILABLE
            </span>

            <span className="occupied-pill">
              <i></i>
              1 OCCUPIED
            </span>

            <span className="fee-pill">
              💳 ₹20 TODAY
            </span>
          </div>

          <button
            className="park-button"
            onClick={() => navigate("/parking")}
          >
            PARK MY CAR <b>→</b>
          </button>
        </section>

        {/* HERO */}
        <section className="hero">

          <div className="hero-content">

            <div className="hero-tag">
              <span>✨</span>
              YOUR PARKING SPACE
            </div>

            <h2>
              Your parking,
              <br />
              <span>made simple.</span>
            </h2>

            <p>
              Find an available slot, reserve it, and park without the hassle.
            </p>

            <div className="hero-actions">

              <button
                className="hero-button"
                onClick={() => navigate("/parking")}
              >
                Find my parking spot
                <span>→</span>
              </button>

              <div className="mini-note">
                🚗 Your Hyundai Creta
              </div>

            </div>
          </div>

          {/* PARKING MINI WORLD */}
          <div className="parking-mini">

            <div className="cloud cloud-one"></div>
            <div className="cloud cloud-two"></div>

            <div className="parking-title">
              <span>🏁</span>
              MAIN PARKING LOT
            </div>

            <div className="entrance">
              ENTRANCE
            </div>

            <div className="road road-one"></div>
            <div className="road road-two"></div>

            {slots.map((slot) => (
              <button
                key={slot.id}
                className={`slot ${slot.status} ${
                  selectedSlot === slot.id
                    ? "chosen"
                    : ""
                }`}
                onClick={() => {
                  if (slot.status !== "occupied") {
                    setSelectedSlot(slot.id);
                  }
                }}
              >
                <span>
                  {slot.id}
                </span>

                {slot.status === "occupied" && (
                  <small>
                    BUSY
                  </small>
                )}

                {selectedSlot === slot.id &&
                  slot.status !== "occupied" && (
                    <small>
                      YOUR SPOT
                    </small>
                  )}
              </button>
            ))}

            <div
              className={`car ${
                showParking
                  ? "car-driving"
                  : ""
              }`}
            >
              🚙
            </div>

            <div
              className={`exhaust ${
                showParking
                  ? "smoking"
                  : ""
              }`}
            >
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>

            <div className="direction">
              <span>→</span>
              <span>→</span>
              <span>→</span>
            </div>

            <div className="selected-message">
              📍 Park here:{" "}
              <strong>
                {selectedSlot}
              </strong>
            </div>

          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions">

          {/* CHECK IN */}
          <div
            className="quick-card orange"
            onClick={() => navigate("/parking")}
          >
            <div className="quick-icon">
              🚗
            </div>

            <div>
              <small>
                READY?
              </small>

              <h3>
                Check In
              </h3>

              <p>
                Drive into your reserved spot.
              </p>
            </div>

            <span>
              →
            </span>
          </div>

          {/* CHECK OUT */}
          <div
            className="quick-card blue"
            onClick={() => navigate("/checkout")}
          >
            <div className="quick-icon">
              💨
            </div>

            <div>
              <small>
                LEAVING?
              </small>

              <h3>
                Check Out
              </h3>

              <p>
                Start your departure journey.
              </p>
            </div>

            <span>
              →
            </span>
          </div>

          {/* MY VEHICLES */}
          <div
            className="quick-card purple"
            onClick={() => navigate("/vehicles")}
          >
            <div className="quick-icon">
              🚘
            </div>

            <div>
              <small>
                YOUR GARAGE
              </small>

              <h3>
                My Vehicles
              </h3>

              <p>
                Manage your vehicles.
              </p>
            </div>

            <span>
              →
            </span>
          </div>

        </section>

        {/* BOTTOM GRID */}
        <section className="bottom-grid">

          {/* VEHICLE CARD */}
          <div className="card vehicle-card">

            <div className="card-top">
              <span className="card-label">
                🚘 MY VEHICLE
              </span>

              <span className="ready-badge">
                READY
              </span>
            </div>

            <div className="vehicle-display">

              <div className="vehicle-emoji">
                🚙
              </div>

              <div>
                <h3>
                  Hyundai Creta
                </h3>

                <p>
                  TS 09 AB 5678
                </p>

                <span className="vehicle-type">
                  CAR
                </span>
              </div>

            </div>

            <div className="vehicle-info">
              <span>
                📍 Selected bay
              </span>

              <strong>
                {selectedSlot}
              </strong>
            </div>

          </div>

          {/* PARKING SPACES */}
          <div className="card">

            <div className="card-top">

              <div>
                <span className="card-label">
                  🅿️ PARKING SPACES
                </span>

                <h3>
                  Choose your bay
                </h3>
              </div>

              <span className="legend">
                <i className="green"></i>
                Free

                <i className="red"></i>
                Busy
              </span>

            </div>

            <div className="spaces">

              {slots.map((slot) => (
                <button
                  key={slot.id}
                  className={`space ${
                    slot.status === "occupied"
                      ? "busy"
                      : selectedSlot === slot.id
                      ? "selected-space"
                      : ""
                  }`}
                  disabled={
                    slot.status === "occupied"
                  }
                  onClick={() =>
                    setSelectedSlot(slot.id)
                  }
                >
                  <strong>
                    {slot.id}
                  </strong>

                  <small>
                    {slot.status === "occupied"
                      ? "Busy"
                      : selectedSlot === slot.id
                      ? "Your bay"
                      : "Free"}
                  </small>
                </button>
              ))}

            </div>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer>
        <strong>
          SmartPark
        </strong>

        <span>
          Park smarter. Drive happier. 🚗
        </span>

        <span>
          © 2026 SmartPark
        </span>
      </footer>

    </div>
  );
}


/* ROUTER */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/parking"
          element={<Parking />}
        />

        <Route
          path="/checkout"
          element={<CheckOut />}
        />

        <Route
          path="/vehicles"
          element={<MyVehicles />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;