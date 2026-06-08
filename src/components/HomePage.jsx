import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRide } from "../api";
import { useNavigate } from "react-router-dom";

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
const LARGE_BASE_FARE = Number(import.meta.env.VITE_LARGE_BASE_FARE);
const NORMAL_BASE_FARE = Number(import.meta.env.VITE_NORMAL_BASE_FARE);
const PRICE_PER_KM = Number(import.meta.env.VITE_PRICE_PER_KM);
const PRICE_PER_MIN = Number(import.meta.env.VITE_PRICE_PER_MIN);
const API_URL = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const [mapsLink, setMapsLink] = useState("");
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);

  // NEW: used for debouncing the search
  const searchTimeoutRef = useRef(null);
  const routeSourceId = "route";
  const routeLayerId = "route-layer";
  const [settingDestination, setSettingDestination] = useState(false);

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [fare, setFare] = useState(null);
  const [rideType, setRideType] = useState("normal");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const flag = localStorage.getItem("busy");

    if (flag === "true") {
      navigate("/ride-status");
    }
  }, [navigate]);

  // Get user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setOrigin(coords);
        initializeMap(coords);
      },
      () => {
        setError("Unable to access your location.");
      },
    );

    // Cleanup timeout when component unmounts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Initialize map
  const initializeMap = (center) => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_KEY}`,
      center: [center.lng, center.lat],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    originMarkerRef.current = new maplibregl.Marker({
      color: "green",
      draggable: true, // Allow the user to drag the marker
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    // Update origin when dragging ends
    originMarkerRef.current.on("dragend", () => {
      const lngLat = originMarkerRef.current.getLngLat();

      const newOrigin = {
        lat: lngLat.lat,
        lng: lngLat.lng,
      };

      // Update state
      setOrigin(newOrigin);

      // Recalculate route if a destination is already selected
      if (destination) {
        calculateRoute(newOrigin, destination);
      }
    });

    map.on("click", (e) => {
      const coords = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      };

      setDestination(coords);
      placeDestinationMarker(coords);

      // Use the CURRENT origin marker position, not the original `center`
      const currentOrigin = originMarkerRef.current.getLngLat();

      calculateRoute(
        {
          lat: currentOrigin.lat,
          lng: currentOrigin.lng,
        },
        coords,
      );
    });

    mapRef.current = map;
  };

  // Place destination marker
  const placeDestinationMarker = (coords) => {
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
    }

    destinationMarkerRef.current = new maplibregl.Marker({ color: "red" })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapRef.current);
  };

  // Actual API call
  const fetchSuggestions = async (value) => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Base URL
      let url =
        `https://api.geoapify.com/v1/geocode/autocomplete` +
        `?text=${encodeURIComponent(value)}` +
        `&limit=5`;

      // Bias results toward the user's current origin
      if (origin) {
        url += `&bias=proximity:${origin.lng},${origin.lat}`;
      }

      // Optional: Restrict to Zimbabwe only
      url += `&filter=countrycode:zw`;

      // API key
      url += `&apiKey=${GEOAPIFY_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setSuggestions([]);
    }
  };

  // Debounced search handler
  const handleSearch = (value) => {
    setSearch(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear suggestions immediately if fewer than 3 characters
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    // Wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };
  // Add this new helper function anywhere inside your component
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

  // Select suggestion
  const selectSuggestion = (feature) => {
    const coords = {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    };

    setSearch(feature.properties.formatted || "");
    setSuggestions([]);
    setDestination(coords);

    placeDestinationMarker(coords);

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 15,
    });

    if (origin) {
      calculateRoute(origin, coords);
    }
  };

  // Calculate route and fare
  // Replace your calculateRoute function with this version
  const calculateRoute = async (start, end) => {
    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=drive&apiKey=${GEOAPIFY_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      // Get the full route feature (includes geometry)
      const routeFeature = data.features?.[0];
      if (!routeFeature) return;

      const route = routeFeature.properties;

      // Draw route on the map
      drawRoute(routeFeature);

      // Fit map to route bounds
      // Fit map to route bounds
      let coordinates = routeFeature.geometry.coordinates;

      // Geoapify may return MultiLineString
      if (routeFeature.geometry.type === "MultiLineString") {
        coordinates = coordinates.flat();
      }

      const bounds = new maplibregl.LngLatBounds();

      coordinates.forEach((coord) => {
        bounds.extend(coord); // coord is [lng, lat]
      });

      mapRef.current.fitBounds(bounds, {
        padding: 60,
        duration: 1000,
      });

      coordinates.forEach((coord) => bounds.extend(coord));

      mapRef.current.fitBounds(bounds, {
        padding: 60,
        duration: 1000,
      });

      // Calculate summary values
      const km = route.distance / 1000;
      const minutes = route.time / 60;
      const baseFare =
        rideType === "normal" ? NORMAL_BASE_FARE : LARGE_BASE_FARE;

      const estimatedFare = Math.ceil(
        baseFare + km * PRICE_PER_KM + minutes * PRICE_PER_MIN,
      );

      setDistanceKm(km);
      setDurationMin(minutes);
      setFare(estimatedFare);
    } catch (err) {
      console.error("Failed to calculate route:", err);
      setError("Failed to calculate route.");
    }
  };

  // Request ride
  const handleRequestRide = async () => {
    if (!origin || !destination) {
      setError("Please select a destination.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("user_token");
      const user_id = localStorage.getItem("user_id");

      const response = await createRide(token, {
        user_id: user_id,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        distance_km: distanceKm,
        estimated_minutes: durationMin,
        fare_amount: fare,
        size: rideType,
      });

      alert("Ride requested successfully!");
      const ride = response.ride || response.data?.ride || response.data;

      localStorage.setItem("ride_id", ride.id);

      localStorage.setItem("busy", true);
      localStorage.setItem(
        "currentRide",
        JSON.stringify({
          ride,
          riderLocation: origin,
        }),
      );
      sessionStorage.setItem(
        "currentRide",
        JSON.stringify({
          ride,
          riderLocation: origin,
        }),
      );

      navigate("/ride-status", {
        state: {
          ride,
          riderLocation: origin,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request ride.");
    } finally {
      setLoading(false);
    }
  };
  const extractCoordinates = (url) => {
    try {
      // Direct coordinates
      const coordMatch = url.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);

      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
        };
      }

      // Google Maps @lat,lng
      const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

      if (atMatch) {
        return {
          lat: parseFloat(atMatch[1]),
          lng: parseFloat(atMatch[2]),
        };
      }

      // ?q=lat,lng
      const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

      if (qMatch) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2]),
        };
      }

      return null;
    } catch (err) {
      return null;
    }
  };
  const handleMapsLink = async () => {
    if (settingDestination) return;

    try {
      setSettingDestination(true);
      setError("");

      let coords = extractCoordinates(mapsLink);

      if (!coords) {
        coords = await resolveGoogleMapsLink(mapsLink);
      }

      if (!coords) {
        setError("Could not determine destination.");
        return;
      }

      setDestination(coords);
      placeDestinationMarker(coords);

      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 15,
      });

      if (origin) {
        await calculateRoute(origin, coords);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid Google Maps link.");
    } finally {
      setSettingDestination(false);
    }
  };
  const resolveGoogleMapsLink = async (url) => {
    const response = await fetch(`${API_URL}/maps/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    return data.coordinates;
  };
  useEffect(() => {
    if (!distanceKm || !durationMin) return;

    const baseFare = rideType === "normal" ? NORMAL_BASE_FARE : LARGE_BASE_FARE;

    const estimatedFare = Math.ceil(
      baseFare + distanceKm * PRICE_PER_KM + durationMin * PRICE_PER_MIN,
    );

    setFare(estimatedFare);
  }, [rideType, distanceKm, durationMin]);
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Request a Ride</h2>

        {error && <p style={styles.error}>{error}</p>}

        {/* MAP LINK */}
        <div style={styles.section}>
          <input
            type="text"
            placeholder="Paste Google Maps link"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={handleMapsLink}
            disabled={settingDestination}
            style={styles.primaryButton}
          >
            {settingDestination ? "Setting destination..." : "Use Map Link"}
          </button>

          {settingDestination && (
            <p style={styles.infoText}>Resolving Google Maps link...</p>
          )}
        </div>

        {/* SEARCH */}
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Type destination name"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={styles.input}
          />

          {suggestions.length > 0 && (
            <div style={styles.dropdown}>
              {suggestions.map((item, index) => (
                <div
                  key={item.properties?.place_id || index}
                  onClick={() => selectSuggestion(item)}
                  style={styles.suggestionItem}
                >
                  {item.properties?.formatted ||
                    item.properties?.name ||
                    item.properties?.address_line1 ||
                    item.properties?.city ||
                    "Unnamed location"}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAP */}
        <h3>Map</h3>
        <p>Green pin is your location, red is your destination</p>
        <div ref={mapContainer} style={styles.map} />
        <div>
          <h3>Select Ride Type</h3>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setRideType("normal")}
              style={{
                padding: "12px 20px",
                border:
                  rideType === "normal" ? "2px solid blue" : "1px solid #ccc",
                // background: rideType === "normal" ? "#eef5ff" : "#fff",
                borderRadius: "8px",
              }}
            >
              🚗 Normal Ride
            </button>

            <button
              onClick={() => setRideType("large suv")}
              style={{
                padding: "12px 20px",
                border:
                  rideType === "large suv"
                    ? "2px solid blue"
                    : "1px solid #ccc",
                // background: rideType === "large suv" ? "#eef5ff" : "#fff",
                borderRadius: "8px",
              }}
            >
              🚙 Large SUV
            </button>
          </div>

          <p>Selected: {rideType}</p>
        </div>

        {/* SUMMARY */}
        {distanceKm && (
          <div style={styles.summaryCard}>
            <h3 style={styles.subTitle}>Trip Summary</h3>

            <p>
              <strong>Distance:</strong> {distanceKm.toFixed(2)} km
            </p>
            <p>
              <strong>ETA:</strong> {Math.round(durationMin)} min
            </p>
            <p>
              <strong>Estimated Fare:</strong> ${fare.toFixed(0)}
            </p>
          </div>
        )}

        {/* ACTION */}
        <button
          onClick={handleRequestRide}
          disabled={loading || !destination}
          style={{
            ...styles.requestButton,
            opacity: loading || !destination ? 0.6 : 1,
          }}
        >
          {loading ? "Requesting Ride..." : "Request Ride"}
        </button>
      </div>
    </div>
  );
};
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  title: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    textAlign: "center",
  },

  section: {
    marginBottom: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },

  primaryButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  requestButton: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  searchWrapper: {
    position: "relative",
    marginBottom: "14px",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    maxHeight: "220px",
    overflowY: "auto",
    zIndex: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },

  suggestionItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f1f1",
  },

  map: {
    width: "100%",
    height: "320px",
    borderRadius: "12px",
    marginBottom: "14px",
    border: "1px solid #eee",
  },

  summaryCard: {
    backgroundColor: "#f9fafb",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
  },

  subTitle: {
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "700",
  },

  error: {
    color: "red",
    marginBottom: "10px",
  },

  infoText: {
    color: "#2563eb",
    fontSize: "13px",
  },
};
export default HomePage;
