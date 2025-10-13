// src/apis/articleApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/article`;

// Get all articles
export const fetchArticlesApi = async () => {
  try {
    const res = await axios.get(`${API_BASE}/get`);
    return res.data;
  } catch (err) {
    console.error("Error fetching articles:", err);
    throw err;
  }
};

// Create a new article
export const createArticleApi = async (formData) => {
  try {
    const res = await axios.post(`${API_BASE}/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating article:", err);
    throw err;
  }
};

// Update an article
export const updateArticleApi = async (id, formData) => {
  try {
    const res = await axios.put(`${API_BASE}/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating article:", err);
    throw err;
  }
};

// Delete an article
export const deleteArticleApi = async (id) => {
  try {
    await axios.delete(`${API_BASE}/delete/${id}`);
  } catch (err) {
    console.error("Error deleting article:", err);
    throw err;
  }
};
