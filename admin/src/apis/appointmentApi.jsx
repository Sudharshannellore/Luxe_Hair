import axios from "axios";

  const API_URL = import.meta.env.VITE_API_URL


const API_BASE = `${API_URL}/booking`;

// Get all appointments
export const getAppointments = async () => {
  const res = await axios.get(`${API_BASE}/all`);
  return res.data;
};

// Update appointment status
export const updateAppointmentStatus = async (id, status) => {
  const res = await axios.patch(`${API_BASE}/status/${id}`, { status });
  return res.data;
};

// Update payment status
export const updatePaymentStatus = async (id, paymentStatus) => {
  const res = await axios.patch(`${API_BASE}/payment/${id}`, { paymentStatus });
  return res.data;
};

//assign Staff
export const assignStaffToBooking = async (bookingId, staffId) => {
  const res = await axios.post(`${API_BASE}/assign-staff`, {
    bookingId,
    staffId,
  });
  return res.data;
};