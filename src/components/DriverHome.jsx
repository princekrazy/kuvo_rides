import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDriverDetails,
  updateDriverInfo,
  getRiderDetails,
  driverCancel,
  driverAccept,
  driverComplete,
  getRides, updateDriverLocation
} from "../api";
import { useConfirmLeave } from "./BackHook";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
const DriverHomePage = () => {
  const routeSourceId = "route";
  const routeLayerId = "route-layer";
  const drawRoute = (routeFeature) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing route layer/source if they already exist
    if (map.getLayer(routeLayerId)) {
      map.removeLayer(routeLayerId);
    }

    if (map.getSource(routeSourceId)) {
      map.removeSource(routeSourceId);
    }

    // Add the new route source
    map.addSource(routeSourceId, {
      type: "geojson",
      data: routeFeature,
    });

    // Add the route line layer
    map.addLayer({
      id: routeLayerId,
      type: "line",
      source: routeSourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#2563eb",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });
  };
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [driverLocation, setDriverLocation] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicleDetails, setvehicleDetails] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [mode, setMode] = useState("list");
  const [riderName, setRiderName] = useState(null);
  const [riderPhone, setRiderPhone] = useState(null);
  const [rideType, setRideType] = useState("normal");
  const [backMessage, setBackMessage] = useState(
    "are you sure you want to leave the page?",
  );

  useConfirmLeave(backMessage);
  // Put this near the top of your component
  const locationIntervalRef = useRef(null);

  // Function to start sending location updates
  const startLocationUpdates = (ride) => {
    const rideId = ride?.id;
    if (!rideId) return;
    // Prevent multiple intervals from running
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    locationIntervalRef.current = setInterval(async () => {
      try {
        await updateDriverLocation(
  {
    ride_id: rideId,
    ...driverLocation,
  },
  token
);
      } catch (err) {
        console.error(err);
      }
    }, 180000); // every 3 minutes
  };

  // Function to stop sending location updates
  const stopLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };
  // "list" | "preview" | "accepted"
  const navigate = useNavigate();
  const initializeMap = (center) => {
    if (!mapContainer.current) {
     
      return;
    }

    // Prevent creating the map twice
    if (mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_KEY}`,
      center: [center.lng, center.lat],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    driverMarkerRef.current = new maplibregl.Marker({ color: "green" })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    mapRef.current = map;
  };
  const showRideOnMap = async (ride) => {
    if (!mapRef.current || !driverLocation) return;

    const pickup = {
      lat: Number(ride.origin_lat),
      lng: Number(ride.origin_lng),
    };

    const destination = {
      lat: Number(ride.destination_lat),
      lng: Number(ride.destination_lng),
    };

    // Pickup marker (blue)
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
    pickupMarkerRef.current = new maplibregl.Marker({ color: "blue" })
      .setLngLat([pickup.lng, pickup.lat])
      .addTo(mapRef.current);

    // Destination marker (red)
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
    destinationMarkerRef.current = new maplibregl.Marker({ color: "red" })
      .setLngLat([destination.lng, destination.lat])
      .addTo(mapRef.current);

    // Route: driver -> pickup -> destination
    const url =
      `https://api.geoapify.com/v1/routing` +
      `?waypoints=` +
      `${driverLocation.lat},${driverLocation.lng}|` +
      `${pickup.lat},${pickup.lng}|` +
      `${destination.lat},${destination.lng}` +
      `&mode=drive` +
      `&apiKey=${GEOAPIFY_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const routeFeature = data.features?.[0];
    if (!routeFeature) return;

    drawRoute(routeFeature); // reuse your existing drawRoute()
  };
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, []);

  // 1. Get the driver's current location once on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error("Failed to get location:", err);
      },
    );
  }, []);

  // 2. Fetch driver details and handle authentication
  useEffect(() => {
    const fetchDriver = async () => {
      const token = localStorage.getItem("driver_token");

      if (!token) {
        navigate("/driverlogin");
        return;
      }

      try {
        const response = await getDriverDetails(token);

        setDriver(response.data);
        localStorage.setItem("wallet", response.data.wallet_balance);
        setvehicleDetails(response.data.vehicle_details || "");
        setLicenseNumber(response.data.license_number || "");
        setRideType(response.data.size || "");
       
      } catch (err) {
        setError("Failed to fetch driver info. Please login again.");
        localStorage.removeItem("driver_token");
        navigate("/driverlogin");
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [navigate]);

  // 3. Fetch available rides and poll every 10 minutes
  useEffect(() => {
    if (mode !== "list") return;

    const fetchRides = async () => {
      try {
        const token = localStorage.getItem("driver_token");

        const res = await getRides(rideType);
        const data = await res.data;
        setRides(data.rides || []);
      } catch (err) {
        console.error("Failed to fetch rides:", err);
      }
    };
 

    // initial fetch immediately when active
    fetchRides();

    // start polling
    const interval = setInterval(fetchRides, 120000); // 10 minutes

    // cleanup when mode changes or component unmounts
    return () => clearInterval(interval);
  }, [mode,rideType]);
  useEffect(() => {
    if (!driverLocation) return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    initializeMap(driverLocation);
  }, [driverLocation]);
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (mode !== "active") return;

    const watchId = navigator.geolocation.watchPosition((pos) => {
      setDriverLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mode]);
  useEffect(() => {
    if (mode !== "active" || !selectedRide || !driverLocation) return;

    const token = localStorage.getItem("driver_token");
    const driver_id = localStorage.getItem("driver_id");

    const interval = setInterval(async () => {
      try {
       await updateDriverLocation(
  {
    ride_id: selectedRide.id,
    ...driverLocation,
  },
  token
);
      } catch (err) {
        console.error(err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [mode, selectedRide, driverLocation]);
   useEffect(() => {
    const flag = localStorage.getItem("driverbusy");

    if (flag === "true") {
      const rideInfo = JSON.parse(localStorage.getItem("RideInfo"));
      setSelectedRide(rideInfo.ride);
      setRiderName(rideInfo.riderName);
      setRiderPhone(rideInfo.riderPhone);
      setMode("active");
    }
  }, []);
  const handleAcceptRide = async (ride) => {
    try {
      const user_id = ride.user_id;
      const driver_id = localStorage.getItem("driver_id");
      const response = await driverAccept({
        ride_id: ride.id,
        driver_id: driver_id,
      });
      const riderdata = await getRiderDetails(user_id);
      setRiderName(riderdata.data.name);
      setRiderPhone(riderdata.data.phone);
      setSelectedRide(ride);
      localStorage.setItem("driverbusy", true);
         localStorage.setItem(
        "RideInfo",
        JSON.stringify({
          ride,
    riderName: riderdata.data.name,
    riderPhone: riderdata.data.phone,
        }),
      );
      setMode("active");
      setBackMessage(
        "you currently have a ride ongoing, are you sure you want to leave?",
      );
      startLocationUpdates(selectedRide);
    } catch (error) {
      console.error("Failed to accept ride:", error);
    }
  };
  const handleCompleteRide = async (ride) => {
    try {
      stopLocationUpdates();

      const driver_id = localStorage.getItem("driver_id");
      const ride_id = ride.id; // ✅ use parameter, not state

      const response = await driverComplete({ ride_id, driver_id });

  
      const { commission, wallet, message } = response.data;

      alert(
        `Ride Completed\n\n` +
          `Commission Charged: $${commission.toFixed(2)}\n` +
          `New Wallet Balance: $${wallet.toFixed(2)}`,
      );

      setSelectedRide(null);
      localStorage.removeItem("RideInfo");
      localStorage.removeItem("driverbusy");
      setMode("list");
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("driver_token");
    navigate("/driverlogin");
  };

  const handleUpdate = async () => {
    
    setShowForm(false);
    setError("");
    setUpdateLoading(true);
    const token = localStorage.getItem("driver_token");

    try {
      const response = await updateDriverInfo(token, {
        vehicle_description: vehicleDetails,
        license_number: licenseNumber,
        size: rideType,
      });
      setDriver((prev) => ({
        ...prev,
        vehicle_details: vehicleDetails,
        license_number: licenseNumber,
        size: rideType,
      }));
      alert("Driver info updated successfully!");
    } catch (err) {
      if (err.response?.status === 422) {
        setError("Both fields are required.");
      } else {
        setError(err.response?.data?.message || "Update failed.");
      }
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleOpenMaps = () => {
    const ride = selectedRide;
    const url = `https://www.google.com/maps/dir/?api=1
&origin=${driverLocation.lat},${driverLocation.lng}
&destination=${ride.destination_lat},${ride.destination_lng}
&waypoints=${ride.origin_lat},${ride.origin_lng}
&travelmode=driving`;
    window.open(url, "_blank");
  };
  const handleCall = () => {
    const formatted = riderPhone.startsWith("+")
      ? riderPhone
      : `+${riderPhone}`;
    window.location.href = `tel:${formatted}`;
  };
  const handleWhatsApp = (phoneNumber) => {
    const message = "Hi this is your kuvo driver";
    const formatted = riderPhone.startsWith("263")
      ? riderPhone
      : `${riderPhone}`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "480px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f7f7f8",
        minHeight: "100vh",
      }}
    >
      {/* HEADER CARD */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>Driver Home</h2>
        <p style={mutedText}>Welcome, {driver.name}!</p>

        <p>
          <strong>Vehicle:</strong> {driver.vehicle_description || "Not set"}
        </p>
        <p>
          <strong>License:</strong> {driver.license_number || "Not set"}
        </p>
        <p>
          <strong>Type:</strong> {driver.size || "Not set"}
        </p>

        <button style={primaryButton, {marginRight: 50}} onClick={() => setShowForm(true)}>
          Update Profile
        </button>

        <button style={secondaryButton} onClick={() => navigate("/wallet")}>
          Go to Wallet
        </button>
      </div>

      {/* UPDATE FORM */}
      {showForm && (
        <div style={cardStyle}>
          <h3>Update Details</h3>

          <input
            style={inputStyle}
            type="text"
            placeholder="Vehicle Details"
            value={vehicleDetails}
            onChange={(e) => setvehicleDetails(e.target.value)}
          />

          <input
            style={inputStyle}
            type="text"
            placeholder="License Number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        <div
          style={{
            maxWidth: "400px",
            margin: "20px auto",
            fontFamily: "Arial",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Select Ride Type</h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Normal Ride */}
            <div
              onClick={() => setRideType("normal")}
              style={{
                padding: "15px",
                borderRadius: "10px",
                border:
                  rideType === "normal"
                    ? "2px solid #2563eb"
                    : "1px solid #ddd",
                background: rideType === "normal" ? "#eff6ff" : "white",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>🚗 Normal Ride</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  sedans, hatchbacks, small suvs
                </div>
              </div>

              <input type="radio" checked={rideType === "normal"} readOnly />
            </div>

            {/* Large SUV */}
            <div
              onClick={() => setRideType("large suv")}
              style={{
                padding: "15px",
                borderRadius: "10px",
                border:
                  rideType === "large suv"
                    ? "2px solid #2563eb"
                    : "1px solid #ddd",
                background: rideType === "large suv" ? "#eff6ff" : "white",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>🚙 Large Vehicle</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  large suvs, Double Cabs, Vans
                </div>
              </div>

              <input type="radio" checked={rideType === "large suv"} readOnly />
            </div>
          </div>
        </div>

          <button
            style={primaryButton}
            onClick={handleUpdate}
            disabled={updateLoading}
          >
            {updateLoading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* MAP */}
      <div style={cardStyle}>
        <h3>Map</h3>
        <p>Green pin is your location, blue is origin of ride, red is final destination</p>

        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "300px",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        />
      </div>

      {/* ACTIVE RIDE */}
      {mode === "active" && selectedRide && (
        <div style={cardStyle}>
          <h3>Active Ride</h3>

          <p>
            <strong>Rider:</strong> {riderName || "Unknown"}
          </p>
          <p>
            <strong>Phone:</strong> {riderPhone}
          </p>

          <div style={buttonColumn}>
            <button style={secondaryButton} onClick={handleOpenMaps}>
              Open Directions
            </button>

            <button style={secondaryButton} onClick={handleCall}>
              Call Rider
            </button>

            <button style={secondaryButton} onClick={handleWhatsApp}>
              WhatsApp
            </button>

            <button
              style={successButton}
              onClick={() => handleCompleteRide(selectedRide)}
            >
              Complete Ride
            </button>
          </div>
        </div>
      )}

      {/* RIDE LIST */}
      {mode === "list" && (
        <div style={cardStyle}>
          <h3>Available Rides</h3>

          {rides.map((ride) => (
            <div
              key={ride.id}
              onClick={() => {
                setSelectedRide(ride);
                setMode("preview");
                showRideOnMap(ride);
              }}
              style={rideCard}
            >
              <p>
                <strong>Fare:</strong> ${Number(ride.fare).toFixed(2)}
              </p>
              <p>
                <strong>Distance:</strong> {Number(ride.distance_km).toFixed(2)}{" "}
                km
              </p>
              <p>
                <strong>ETA:</strong>{" "}
                {Math.round(Number(ride.estimated_minutes))} min
              </p>
            </div>
          ))}

          <button style={secondaryButton} onClick={() => navigate("/home")}>
            Switch to Rider Mode
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {mode === "preview" && selectedRide && (
        <div style={cardStyle}>
          <h3>Ride Preview</h3>

          <p>
            <strong>Fare:</strong> ${Number(selectedRide.fare).toFixed(2)}
          </p>
          <p>
            <strong>Distance:</strong>{" "}
            {Number(selectedRide.distance_km).toFixed(2)} km
          </p>
          <p>
            <strong>ETA:</strong>{" "}
            {Math.round(Number(selectedRide.estimated_minutes))} min
          </p>

          <div style={buttonRow}>
            <button style={secondaryButton} onClick={() => setMode("list")}>
              Back
            </button>

            <button
              style={successButton}
              onClick={() => handleAcceptRide(selectedRide)}
            >
              Accept Ride
            </button>
          </div>
        </div>
      )}

      {/* FOOTER ACTION */}
      <button style={dangerButton} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};
const cardStyle = {
  background: "#fff",
  padding: "16px",
  borderRadius: "14px",
  marginBottom: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const titleStyle = {
  margin: "0 0 8px 0",
};

const mutedText = {
  color: "#666",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "8px 0",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const buttonBase = {
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  marginTop: "8px",
  fontWeight: "600",
};

const primaryButton = {
  ...buttonBase,
  background: "#000",
  color: "#fff",
};

const secondaryButton = {
  ...buttonBase,
  background: "#eee",
  color: "#000",
};

const successButton = {
  ...buttonBase,
  background: "green",
  color: "#fff",
};

const dangerButton = {
  ...buttonBase,
  background: "red",
  color: "#fff",
  width: "100%",
  marginTop: "16px",
};

const rideCard = {
  padding: "12px",
  border: "1px solid #eee",
  borderRadius: "10px",
  marginBottom: "10px",
  cursor: "pointer",
  background: "#fafafa",
};

const buttonColumn = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const buttonRow = {
  display: "flex",
  gap: "10px",
};

export default DriverHomePage;
