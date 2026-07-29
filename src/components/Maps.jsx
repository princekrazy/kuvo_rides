import React, { useState, useCallback } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: -17.919877816321293,
  lng: 31.099178162570194,
};

export default function LocationPicker() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLink, setMapLink] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setSelectedLocation({ lat, lng });

    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    console.log(url);
    setMapLink(url); // ✅ Saved in variable
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setSelectedLocation({ lat, lng });

      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      setMapLink(url); // ✅ Saved in variable
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={["places"]}>
      <div style={{ padding: "20px" }}>
        <Autocomplete
          onLoad={(auto) => setAutocomplete(auto)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for a place"
            style={{
              width: "300px",
              height: "40px",
              padding: "10px",
              marginBottom: "10px",
            }}
          />
        </Autocomplete>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onClick={onMapClick}
        >
          {selectedLocation && <Marker position={selectedLocation} />}
        </GoogleMap>

        {mapLink && (
          <div style={{ marginTop: "20px" }}>
            <p>
              <strong>Saved URL:</strong>
            </p>
            <p>{mapLink}</p>
            <button onClick={() => window.open(mapLink, "_blank")}>
              Open in Google Maps
            </button>
          </div>
        )}
      </div>
    </LoadScript>
  );
}
