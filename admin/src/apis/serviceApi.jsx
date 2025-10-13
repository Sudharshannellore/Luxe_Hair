// src/api/serviceApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
const API_BASE = `${API_URL}/service`;

// Get all services
export const fetchServicesApi = async () => {
  try {
    const res = await axios.get(`${API_BASE}/get`);
    return res.data;
  } catch (err) {
    console.error("Error fetching services:", err);
    throw err;
  }
};

// Create a new service
export const createServiceApi = async (formData) => {
  try {
    const res = await axios.post(`${API_BASE}/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating service:", err);
    throw err;
  }
};

// Update a service
export const updateServiceApi = async (id, formData) => {
  try {
    const res = await axios.put(`${API_BASE}/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating service:", err);
    throw err;
  }
};

// Delete a service
export const deleteServiceApi = async (id) => {
  try {
    await axios.delete(`${API_BASE}/delete/${id}`);
  } catch (err) {
    console.error("Error deleting service:", err);
    throw err;
  }
};
