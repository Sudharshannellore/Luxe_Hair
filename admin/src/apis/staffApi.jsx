import axios from "axios";

const API_URI = import.meta.env.VITE_API_URL
const API_URL = `${API_URI}/staff`; // Change to your backend URL

// Get all staff
export const getAllStaff = async () => {
  const response = await axios.get(`${API_URL}/get`);
  return response.data;
};

// Create new staff
export const createStaff = async (staffData) => {
  const formData = new FormData();
  for (const key in staffData) {
    if (staffData[key] !== null && staffData[key] !== undefined) {
      formData.append(key, staffData[key]); // no JSON.stringify
    }
  }
  const response = await axios.post(`${API_URL}/save`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.staff;
};


// Update staff
export const updateStaff = async (id, staffData) => {
  const formData = new FormData();
  for (const key in staffData) {
    if (staffData[key] !== null && staffData[key] !== undefined) {
      formData.append(key, staffData[key]); // no JSON.stringify
    }
  }
  const response = await axios.put(`${API_URL}/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.staff;
};

// Delete staff
export const deleteStaff = async (id) => {
  const response = await axios.delete(`${API_URL}/delete/${id}`);
  return response.data;
};

// Get all staff
export const getActiveStaff = async () => {
  const response = await axios.get(`${API_URL}/active-staff`);
  return response.data;
};