export const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Booking dates are stored as UTC midnight of the chosen day, so format in UTC.
export const formatDate = (value, opts = {}) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC", ...opts })
    : "—";

export const formatLongDate = (value) =>
  formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// For timestamps like createdAt (local time).
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

/** "14:00" -> "2:00 PM" */
export const formatSlot = (slot) => {
  if (!slot) return "";
  const [h, m] = slot.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Local calendar date as YYYY-MM-DD. */
export const toDateKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Booking date (UTC midnight) as YYYY-MM-DD. */
export const bookingDateKey = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const daysUntil = (value) => Math.ceil((new Date(value) - new Date()) / 86400000);

export const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";
