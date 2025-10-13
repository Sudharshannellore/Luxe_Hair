// src/api/packageApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
const API_BASE = `${API_URL}/package`;

// Get all packages
export const fetchPackagesApi = async () => {
  try {
    const res = await axios.get(`${API_BASE}/get`);
    return res.data;
  } catch (err) {
    console.error("Error fetching packages:", err);
    throw err;
  }
};

// Create a new package
export const createPackageApi = async (formData) => {
  try {
    const res = await axios.post(`${API_BASE}/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating package:", err);
    throw err;
  }
};

// Update a package
export const updatePackageApi = async (id, formData) => {
  try {
    const res = await axios.put(`${API_BASE}/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating package:", err);
    throw err;
  }
};

// Delete a package
export const deletePackageApi = async (id) => {
  try {
    await axios.delete(`${API_BASE}/delete/${id}`);
  } catch (err) {
    console.error("Error deleting package:", err);
    throw err;
  }
};
