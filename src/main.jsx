import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "maplibre-gl/dist/maplibre-gl.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    {/* <footer
      style={{
        position: "fixed",
        bottom: 20,
        left: "20%",
        transform: "translateX(-50%)",
        padding: "12px 20px",
        border: "2px solid #333",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        textAlign: "center",
      }}
    >
      <a
        href="mailto:primkuzisystems@gmail.com"
        style={{
          fontWeight: "700",
          textDecoration: "none",
          color: "#333",
        }}
      >
        Customer Support
      </a>
    </footer> */}
  </StrictMode>,
);
