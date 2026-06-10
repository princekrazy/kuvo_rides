import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignupPage from "./components/SignupPage";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import DriverHomePage from "./components/DriverHome";
import DriverLoginPage from "./components/DriverLoginPage";
import DriverSignupPage from "./components/DriverSignUp";
import RideStatusScreen from "./components/RideStatusScreen";
import WalletTopUp from "./components/WalletTopUp";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/driversignup" element={<DriverSignupPage />} />
        <Route path="/driverhome" element={<DriverHomePage />} />
        <Route path="/driverlogin" element={<DriverLoginPage />} />
        <Route path="/ride-status" element={<RideStatusScreen />} />
        <Route path="/wallet" element={<WalletTopUp />} />
      </Routes>
    </Router>
  );
}

export default App;
