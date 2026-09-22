import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Parking.css";

function Parking() {
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState("A06");
  const [selectedVehicle, setSelectedVehicle] = useState("Hyundai Creta");

  const slots = [
    { id: "A01", size: "SMALL", status: "AVAILABLE", price: 10 },
    { id: "A02", size: "SMALL", status: "AVAILABLE", price: 10 },
    { id: "A03", size: "SMALL", status: "OCCUPIED", price: 10 },
    { id: "A04", size: "SMALL", status: "AVAILABLE", price: 10 },

    { id: "A05", size: "MEDIUM", status: "AVAILABLE", price: 20 },
    { id: "A06", size: "MEDIUM", status: "AVAILABLE", price: 20 },
    { id: "A07", size: "MEDIUM", status: "AVAILABLE", price: 20 },
    { id: "A08", size: "MEDIUM", status: "AVAILABLE", price: 20 },

    { id: "A09", size: "LARGE", status: "AVAILABLE", price: 30 },
    { id: "A10", size: "LARGE", status: "AVAILABLE", price: 30 },
  ];

  const selected = slots.find(
    (slot) => slot.id === selectedSlot
  );

  return (
    <div className="parking-page">

      {/* NAVBAR */}
      <header className="parking-navbar">

        <div
          className="parking-logo"
          onClick={() => navigate("/")}
        >
          <span className="parking-logo-icon">P</span>

          <span>SmartPark</span>

          <small>
            ● LIVE
          </small>
        </div>

        <nav>
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/vehicles")}>
            My Vehicles
          </button>

          <button className="parking-nav-active">
            Parking
          </button>

          <button onClick={() => navigate("/checkout")}>
            Active Parking
          </button>

          <button onClick={() => navigate("/checkout")}>
            History
          </button>

          <button>
            Profile
          </button>
        </nav>

        <div className="parking-profile">
          <span>10:42 AM</span>
          <span>A</span>
        </div>

      </header>

      {/* PAGE HEADER */}
      <section className="parking-heading">

        <div>
          <span className="parking-eyebrow">
            SMART PARKING • RESERVE YOUR SPACE
          </span>

          <h1>
            Find your
            <span> perfect spot.</span>
          </h1>

          <p>
            Choose your vehicle, select an available parking slot,
            and reserve your space.
          </p>
        </div>

        <div className="parking-availability">
          <strong>9</strong>
          <span>spots available</span>
        </div>

      </section>

      {/* MAIN CONTENT */}
      <main className="parking-content">

        {/* LEFT SIDE */}
        <section className="parking-main-card">

          <div className="parking-card-header">

            <div>
              <span>
                🅿️ PARKING LOT
              </span>

              <h2>
                AU Main Parking
              </h2>

              <p>
                📍 Anurag University
              </p>
            </div>

            <div className="lot-status">
              <i></i>
              ACTIVE
            </div>

          </div>

          {/* PARKING MAP */}
          <div className="parking-map">

            <div className="map-title">
              <span>MAIN PARKING LOT</span>
              <small>
                ENTRANCE →
              </small>
            </div>

            <div className="map-road road-top"></div>
            <div className="map-road road-bottom"></div>

            <div className="map-slots">

              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={slot.status === "OCCUPIED"}
                  className={`
                    parking-slot
                    ${slot.status === "OCCUPIED" ? "slot-occupied" : ""}
                    ${selectedSlot === slot.id ? "slot-selected" : ""}
                  `}
                  onClick={() =>
                    setSelectedSlot(slot.id)
                  }
                >

                  <strong>
                    {slot.id}
                  </strong>

                  <small>
                    {slot.status === "OCCUPIED"
                      ? "BUSY"
                      : selectedSlot === slot.id
                      ? "YOUR SPOT"
                      : slot.size}
                  </small>

                </button>
              ))}

            </div>

            <div className="map-car">
              🚙
            </div>

            <div className="map-arrows">
              → → →
            </div>

            <div className="map-entrance">
              ENTRANCE
            </div>

          </div>

          {/* LEGEND */}
          <div className="parking-legend">

            <span>
              <i className="legend-free"></i>
              Available
            </span>

            <span>
              <i className="legend-selected"></i>
              Selected
            </span>

            <span>
              <i className="legend-busy"></i>
              Occupied
            </span>

          </div>

        </section>

        {/* RIGHT SIDE */}
        <aside className="parking-sidebar">

          {/* VEHICLE */}
          <div className="parking-side-card">

            <div className="side-title">
              <span>🚗 YOUR VEHICLE</span>
              <small>1 VEHICLE</small>
            </div>

            <button
              className="vehicle-option selected-vehicle"
              onClick={() =>
                setSelectedVehicle("Hyundai Creta")
              }
            >

              <div className="vehicle-icon">
                🚙
              </div>

              <div>
                <strong>
                  Hyundai Creta
                </strong>

                <p>
                  TS 09 AB 5678
                </p>

                <span>
                  CAR
                </span>
              </div>

              <b>✓</b>

            </button>

            <button
              className="add-vehicle"
              onClick={() => navigate("/vehicles")}
            >
              + Add another vehicle
            </button>

          </div>

          {/* SELECTED SLOT */}
          <div className="parking-side-card selected-summary">

            <span className="side-title">
              📍 SELECTED SPACE
            </span>

            <div className="selected-slot-big">
              {selectedSlot}
            </div>

            <div className="selected-details">

              <div>
                <small>
                  SIZE
                </small>

                <strong>
                  {selected?.size}
                </strong>
              </div>

              <div>
                <small>
                  RATE
                </small>

                <strong>
                  ₹{selected?.price}/hr
                </strong>
              </div>

            </div>

          </div>

          {/* CONFIRM */}
          <div className="parking-confirm-card">

            <div>
              <span>
                PARKING FEE
              </span>

              <strong>
                ₹{selected?.price}
              </strong>

              <small>
                per hour
              </small>
            </div>

            <button
              onClick={() => {
                alert(
                  `Slot ${selectedSlot} selected for ${selectedVehicle}`
                );
              }}
            >
              CONFIRM PARKING
              <span>→</span>
            </button>

          </div>

        </aside>

      </main>

      {/* FOOTER */}
      <footer className="parking-footer">

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

export default Parking;