import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverLogin } from "../api";

const DriverLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Basic frontend validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      // Call the driver login API
      const response = await driverLogin(email, password);

      // Store token in localStorage for API calls
      localStorage.setItem("driver_token", response.data.access_token);

      // Optionally, store driver email or ID if needed
      localStorage.setItem("driver_email", email);
      localStorage.setItem("driver_id", response.data.driver_id);

      // Redirect to driver home page
      navigate("/driverhome");
    } catch (err) {
      // Handle API errors
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password");
        } else if (err.response.status === 403) {
          setError("This account is not a driver");
        } else {
          setError(err.response.data.message || "Login failed");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Driver Login</h2>

      {/* Error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Don't have a driver account?{" "}
        <button onClick={() => navigate("/driversignup")}>Sign Up</button>
      </p>

      <p>
        Are you trying to get a ride?{" "}
        <button onClick={() => navigate("/login")}>User Login</button>
      </p>
    </div>
  );
};

export default DriverLoginPage;
