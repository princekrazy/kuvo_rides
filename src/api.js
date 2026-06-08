import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Laravel API URL

// ----------------------
// DRIVER API
// ----------------------

// Driver signup
export const updateDriverLocation = async (data, token) => {
  return await axios.post(`${API_URL}/driver/location`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const createPaypalOrder = async (amount, token) => {
  return await axios.post(
    `${API_URL}/paypal/create-order`,
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const capturePaypalOrder = async (orderID, id, token) => {
  return await axios.post(
    `${API_URL}/paypal/capture-order`,
    {
      orderID,
      id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
export const createRide = async (token, data) => {
  return await axios.post(`${API_URL}/rides`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const driverRegister = async ({
  name,
  email,
  password,
  phone_number,
  id_number,
  vehicle_description,
  license_number,
  size,
}) => {
  return await axios.post(`${API_URL}/driver/register`, {
    name,
    email,
    password,
    phone_number,
    id_number,
    vehicle_description,
    license_number,
    size,
  });
};

// Driver login
export const driverLogin = async (email, password) => {
  return await axios.post(`${API_URL}/driver/login`, { email, password });
};

// ----------------------
// USER API
// ----------------------

// User signup
export const userRegister = async ({ name, email, password, phone_number }) => {
  return await axios.post(`${API_URL}/user/register`, {
    name,
    email,
    password,
    phone_number,
  });
};

// User login
export const userLogin = async (email, password) => {
  return await axios.post(`${API_URL}/user/login`, { email, password });
};
export const getRides = async (size) => {
  return await axios.post(`${API_URL}/available_rides`, { size });
};
export const getCurrentRide = async (rideId) => {
  return await axios.get(`${API_URL}/currentRide/${rideId}`);
};

// ----------------------
// GET USER
// ----------------------
export const getUser = async (token) => {
  return await axios.get(`${API_URL}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
// Get driver details
export const getDriverDetails = async (token) => {
  return await axios.get(`${API_URL}/driver/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const getRiderDetails = async (user_id) => {
  return await axios.get(`${API_URL}/rider/${user_id}`, {});
};

// Update driver vehicle & license
export const updateDriverInfo = async (
  token,
  { vehicle_description, license_number, size },
) => {
  return await axios.post(
    `${API_URL}/driver/update`,
    { vehicle_description, license_number, size },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};
export const driverCancel = async ({ ride_id, driver_id }) => {
  return await axios.post(`${API_URL}/cancel-ride`, { ride_id, driver_id });
};
export const driverAccept = async ({ ride_id, driver_id }) => {
  return await axios.post(`${API_URL}/accept-ride`, { ride_id, driver_id });
};
export const driverComplete = async ({ ride_id, driver_id }) => {
  return await axios.post(`${API_URL}/complete-ride`, { ride_id, driver_id });
};
