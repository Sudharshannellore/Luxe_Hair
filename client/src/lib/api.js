import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const TOKEN_KEY = "userToken";
export const USER_KEY = "userInfo";

/** Shared axios instance. Adds the customer's token and signs out on 401. */
const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from an axios error. */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message || error?.response?.data?.error || (error?.code === "ECONNABORTED" ? "The request timed out." : null) || (error?.message === "Network Error" ? "Can't reach the server. Check your connection." : null) || fallback;

/**
 * Image URL for a stored image value. Values are either a full URL (Cloudinary)
 * or a file name served from the API's /uploads folder.
 */
export const imageUrl = (image, fallback = "") => {
  if (!image || image === "no-image.png") return fallback;
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_URL}/uploads/${image}`;
};

export default api;
