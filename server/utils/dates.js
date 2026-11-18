const config = require("../config");

// Bookings store their day as UTC midnight of the calendar date the customer picked
// (e.g. "2026-11-20" -> 2026-11-20T00:00:00Z) plus a "HH:mm" time slot. "Today" and
// "now" are evaluated in the salon's timezone (APP_TIMEZONE).

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const dateKeyToDate = (key) => new Date(`${key}T00:00:00.000Z`);

const dateToKey = (date) => new Date(date).toISOString().slice(0, 10);

const nowParts = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { dateKey: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
};

const todayKey = () => nowParts().dateKey;

const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

module.exports = { DATE_KEY, dateKeyToDate, dateToKey, nowParts, todayKey, addDays };
