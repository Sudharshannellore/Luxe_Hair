import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

/** Shared axios instance for the admin panel (showcase mode: no admin login). */
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.message === "Network Error" ? "Can't reach the server." : null) ||
  fallback;

/** Stored image value -> URL. Full URLs (Cloudinary / hosted) pass through; file names map to /uploads. */
export const imageUrl = (image, fallback = "") => {
  if (!image || image === "no-image.png") return fallback;
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_URL}/uploads/${image}`;
};

export default api;
