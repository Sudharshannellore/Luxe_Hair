// src/api/orderApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
const API_BASE = `${API_URL}/order`;

//  Get all orders
export const fetchOrdersApi = async () => {
  try {
    const res = await axios.get(`${API_BASE}/get-all`);
    return res.data || [];
  } catch (err) {
    console.error("Error fetching orders:", err);
    throw err;
  }
};

//  Mark a service as used
export const useServiceApi = async (orderId, serviceName) => {
  try {
    await axios.patch(`${API_BASE}/use-service`, { orderId, serviceName });
  } catch (err) {
    console.error("Error updating service:", err);
    throw err;
  }
};

//  Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    const res = await axios.patch(`${API_BASE}/update-payment/${orderId}`, {
      paymentStatus,
    });
    return res.data; // updated order returned from backend
  } catch (err) {
    console.error("Error updating payment status:", err);
    throw err;
  }
};

//  Assign staff to a service
export const assignStaffToService = async (orderId, serviceName, staffId) => {
  try {
    const res = await axios.post(`${API_BASE}/assign-staff`, {
      orderId,
      serviceName,
      staffId,
    });
    return res.data; // updated order returned from backend
  } catch (err) {
    console.error("Error assigning staff:", err);
    throw err;
  }
};
