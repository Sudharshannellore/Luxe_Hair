const Booking = require("../models/ServiceBooking");
const Staff = require("../models/Staff");
const { dateKeyToDate, nowParts } = require("./dates");

// Salon opening hours: hourly slots, first at 10:00, last at 19:00.
const TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

// Bookings that still occupy a slot.
const ACTIVE_BOOKING = { status: { $ne: "cancelled" }, paymentStatus: { $ne: "failed" } };

// How many customers can share a slot: one per active stylist (at least 1).
const slotCapacity = async () => Math.max(1, await Staff.countDocuments({ status: "active" }));

const getAvailability = async (dateKey) => {
  const { dateKey: today, time: nowTime } = nowParts();
  const capacity = await slotCapacity();
  const counts = await Booking.aggregate([
    { $match: { date: dateKeyToDate(dateKey), timeSlot: { $in: TIME_SLOTS }, ...ACTIVE_BOOKING } },
    { $group: { _id: "$timeSlot", count: { $sum: 1 } } },
  ]);
  const bySlot = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return TIME_SLOTS.map((time) => {
    const booked = bySlot[time] || 0;
    const past = dateKey < today || (dateKey === today && time <= nowTime);
    return { time, available: !past && booked < capacity, remaining: Math.max(0, capacity - booked), past };
  });
};

module.exports = { TIME_SLOTS, ACTIVE_BOOKING, getAvailability, slotCapacity };
