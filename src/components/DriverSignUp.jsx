import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverRegister } from "../api";
import PhoneInput from "react-phone-input-2";

const DriverSignupPage = () => {
  const [rideType, setRideType] = useState("normal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehicle_Description, setvehicle_Description] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Password match validation
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Call API
      await driverRegister({
        name,
        email,
        password,
        phone_number: phoneNumber,
        id_number: idNumber,
        vehicle_description: vehicle_Description,
        license_number: licenseNumber,
        size: rideType,
      });

      // Redirect on success
      alert("Account successfully created you may log in now.");
      navigate("/driverlogin");
    } catch (err) {
      // Handle API validation errors
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors?.email) setError(errors.email[0]);
        else if (errors?.phone_number) setError(errors.phone_number[0]);
        else if (errors?.id_number) setError(errors.id_number[0]);
        else setError("Validation error. Please check your inputs.");
      } else {
        setError(err.response?.data?.message || "Signup failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Driver Signup Page</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        <br />

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

        <input
          type="password"
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />
        <br />
        <br />

        <PhoneInput
          country={"zw"} // default country (Zimbabwe)
          value={phoneNumber}
          onChange={(value) => setPhoneNumber(value)}
          inputStyle={{
            width: "100%",
            backgroundColor: "#fff",
            color: "#000",
          }}
          dropdownStyle={{
            backgroundColor: "#fff",
            color: "#000",
          }}
          buttonStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
          }}
          searchStyle={{
            backgroundColor: "#fff",
            color: "#000",
          }}
        />
        <br />
        <br />

        <input
          type="text"
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
        />
        <br />
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
        <br />

        <input
          type="text"
          placeholder="Vehicle Details"
          value={vehicle_Description}
          onChange={(e) => setvehicle_Description(e.target.value)}
        />
        <br />
        <br />

        <input
          type="text"
          placeholder="License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
        />
        <br />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      <p>
        Already have a driver account?{" "}
        <button onClick={() => navigate("/driverlogin")}>Driver Login</button>
      </p>

      <p>
        Are you trying to get a ride?{" "}
        <button onClick={() => navigate("/login")}>Get a ride</button>
      </p>
    </div>
  );
};

export default DriverSignupPage;
