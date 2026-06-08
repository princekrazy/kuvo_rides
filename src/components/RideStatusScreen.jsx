import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import echo from "../echo";
import { useConfirmLeave } from "./BackHook";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCurrentRide } from "../api";
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

function RideStatusScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionRide = JSON.parse(localStorage.getItem("currentRide") || "null");
  const ride = location.state?.ride ?? sessionRide?.ride;

  const [riderLocation, setRiderLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("searching");

  const [acceptedRide, setAcceptedRide] = useState(ride);
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [driverPhone, setDriverPhone] = useState(null);
  const [driverName, setDriverName] = useState(null);
  const [driverLicense, setDriverLicense] = useState(null);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [backMessage, setBackMessage] = useState(
    "are you sure you want to leave the page?",
  );

  useConfirmLeave(backMessage);
  useEffect(() => {
    if (status === "accepted") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setRiderLocation(coords);
          initializeMap(coords);
        },
        () => {
          setError("Unable to access your location.");
        },
      );
    }
  }, [status]);
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      placeDriverMarker(driverLocation);
    }
  }, [driverLocation]);
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
    const formatted = driverPhone.startsWith("+")
      ? driverPhone
      : `+${driverPhone}`;

    window.location.href = `tel:${formatted}`;
  };
  const handleWhatsApp = (phoneNumber) => {
    const message = "Hi this is your kuvo rider";
    const formatted = driverPhone.startsWith("263")
      ? driverPhone
      : `${driverPhone}`;

    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  // Initialize map
  const initializeMap = (center) => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_KEY}`,
      center: [center.lng, center.lat],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    riderMarkerRef.current = new maplibregl.Marker({
      color: "green",
      draggable: true, // Allow the user to drag the marker
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    mapRef.current = map;
  };

  // Place destination marker
  const placeDriverMarker = (coords) => {
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
    }

    driverMarkerRef.current = new maplibregl.Marker({ color: "blue" })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapRef.current);
  };

  // Listen for real-time ride status updates
  useEffect(() => {
    if (!ride?.id) return;

    const channel = echo.channel(`ride.${ride.id}`);

    channel.listen(".ride.status.updated", (event) => {});

    return () => {
      echo.leave(`ride.${ride.id}`);
    };
  }, [ride?.id]);

  // Poll driver's location only when accepted
  useEffect(() => {
    if (!ride?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await getCurrentRide(ride.id);
        const data = response.data;

        if (data.status === "complete") {
          localStorage.removeItem("busy");
          localStorage.removeItem("currentRide");
          setStatus("complete");

          return;
        }

        if (data.status === "accepted") {
          setAcceptedRide(data);
          setDriverLocation({
            lat: data.driver_lat,
            lng: data.driver_lng,
          });

          setStatus("accepted");
          setBackMessage(
            "You currently have a ride ongoing are you sure you want to leave?",
          );
          setDriverPhone(data.phone);
          setDriverName(data.name);
          setDriverLicense(data.license);
          setDriverVehicle(data.vehicle);
        }

        if (data.status === "cancelled") {
          setStatus("searching");
        }
      } catch (error) {
        console.error("Polling failed", error);
      }
    }, 6000); // every 3 seconds

    return () => clearInterval(interval);
  }, [ride?.id]);

  // Cancel ride
  const handleCancelRide = async () => {
    try {
      await fetch("/api/ride/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ride_id: ride.id,
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      navigate(-1);
    }
  };

  // if (!ride) {
  //   return <div>No ride data found.</div>;
  // }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Ride Status</h1>

        {/* SEARCHING */}
        {status === "searching" && (
          <div style={styles.centerBlock}>
            <h2 style={styles.heading}>Searching for a driver...</h2>
            <p style={styles.subText}>Please wait while we match you.</p>
          </div>
        )}

        {/* ACCEPTED */}
        {status === "accepted" && (
          <div style={styles.section}>
            <h2 style={styles.successTitle}>🚗 Driver Found!</h2>

            <div style={styles.infoBox}>
              <p>
                <strong>Name:</strong> {driverName}
              </p>
              <p>
                <strong>Phone:</strong> {driverPhone}
              </p>
              <p>
                <strong>License:</strong> {driverLicense}
              </p>
              <p>
                <strong>Vehicle:</strong> {driverVehicle}
              </p>
            </div>

            {/* Map */}
            <p>Blue Pin: Driver's Location, Green Pin: Your Location</p>
            <div ref={mapContainer} style={styles.map} />

            {/* Actions */}
            <div style={styles.buttonRow}>
              <button style={styles.primaryButton} onClick={handleCall}>
                Call
              </button>

              <button style={styles.whatsappButton} onClick={handleWhatsApp}>
                Chat on WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {status === "complete" && (
          <div style={styles.centerBlock}>
            <h2 style={styles.successTitle}>🎉 Ride Complete</h2>
            <p style={styles.subText}>Hope you had a good trip.</p>

            <button
              style={styles.primaryButton}
              onClick={() => navigate("/home")}
            >
              Request New Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  whatsappButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#25D366", // WhatsApp green
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  title: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    textAlign: "center",
  },

  heading: {
    fontSize: "18px",
    fontWeight: "700",
    marginTop: "10px",
  },

  subText: {
    fontSize: "13px",
    color: "#666",
    marginTop: "6px",
  },

  successTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: "12px",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  centerBlock: {
    textAlign: "center",
    padding: "20px 10px",
  },

  infoBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  map: {
    width: "100%",
    height: "300px",
    borderRadius: "12px",
    marginTop: "10px",
    border: "1px solid #eee",
  },

  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },

  primaryButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #eee",
    borderTop: "4px solid #000",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 1s linear infinite",
  },
};

export default RideStatusScreen;
