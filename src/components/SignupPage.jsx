import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userRegister } from "../api";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation: passwords must match
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Call API
      await userRegister({
        name,
        email,
        password,
        phone_number: phoneNumber,
      });
      alert("Account created successfully, you may log in now.");

      // Redirect to user login after successful signup
      navigate("/login");
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors?.email) setError(errors.email[0]);
        else if (errors?.phone_number) setError(errors.phone_number[0]);
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
      <h2>Rider Signup Page</h2>

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

        <button type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")}>Login</button>
      </p>

      <p>
        Trying to become a driver?{" "}
        <button onClick={() => navigate("/driversignup")}>
          Become a driver
        </button>
      </p>
    </div>
  );
};

export default SignupPage;
