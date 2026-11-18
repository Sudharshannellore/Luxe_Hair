const Booking = require("../models/ServiceBooking");
const Service = require("../models/Service");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Settings = require("../models/PaymentSettings");
const { createDemoPayment } = require("../utils/demoPayment");
const emails = require("../templates/emails");
const { queueEmail } = require("../utils/sendEmail");
const { quote } = require("../utils/pricing");
const { httpError } = require("../utils/httpError");
const { getAvailability } = require("../utils/slots");
const { DATE_KEY, dateKeyToDate, dateToKey, todayKey, addDays } = require("../utils/dates");

const MAX_DAYS_AHEAD = 90;

const ensurePaymentMethodAllowed = async (method) => {
  const settings = await Settings.current();
  if (method === "cod" && !settings.payment.cod) throw httpError(400, "Pay at salon is currently unavailable.");
  if (method === "online" && !settings.payment.online) {
    throw httpError(400, "Online payment is currently unavailable.");
  }
};

const ensureBookableDate = (dateKey) => {
  const today = todayKey();
  const max = dateToKey(addDays(dateKeyToDate(today), MAX_DAYS_AHEAD));
  if (dateKey < today) throw httpError(400, "Please choose today or a future date.");
  if (dateKey > max) throw httpError(400, `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.`);
};

const ADMIN_POPULATE = [
  { path: "service", select: "title price image category duration" },
  { path: "user", select: "username email phone image" },
  { path: "assignedStaff", select: "name email image status" },
];

const notify = (booking, template) => {
  const user = booking.user;
  const service = booking.service;
  if (!user?.email || !service) return;
  const { subject, html } = template({ name: user.username, booking, service });
  queueEmail(user.email, subject, html);
};

// ================== PUBLIC / CUSTOMER ==================

// GET /booking/slots?date=YYYY-MM-DD
exports.getSlots = async (req, res) => {
  const { date } = req.query;
  if (!DATE_KEY.test(date || "")) throw httpError(400, "date must be YYYY-MM-DD");
  ensureBookableDate(date);
  res.json({ date, slots: await getAvailability(date) });
};

exports.createBooking = async (req, res) => {
  const { serviceId, date, timeSlot, paymentMethod, couponCode } = req.body;

  ensureBookableDate(date);
  await ensurePaymentMethodAllowed(paymentMethod);

  const [user, service] = await Promise.all([User.findById(req.userId), Service.findById(serviceId)]);
  if (!user) throw httpError(404, "User not found");
  if (!service) throw httpError(404, "Service not found");

  const slot = (await getAvailability(date)).find((s) => s.time === timeSlot);
  if (!slot?.available) throw httpError(409, "That time slot is no longer available. Please pick another.");

  // Price is always computed on the server.
  const price = await quote({ price: service.price, couponCode, userId: user._id });

  const booking = await Booking.create({
    user: user._id,
    service: service._id,
    date: dateKeyToDate(date),
    timeSlot,
    paymentMethod,
    paymentStatus: "pending",
    ...price,
  });
  booking.user = user;
  booking.service = service;

  if (paymentMethod === "online" && booking.finalPrice > 0) {
    const payment = createDemoPayment({
      type: "booking",
      id: booking._id,
      amount: booking.finalPrice,
      description: service.title,
      prefill: { name: user.username, email: user.email, contact: user.phone || "" },
    });
    booking.paymentRef = payment.reference;
    await booking.save();
    return res.status(201).json({ message: "Complete the payment to confirm your booking", booking, payment });
  }

  if (paymentMethod === "online") {
    // Fully discounted: nothing to charge.
    booking.paymentStatus = "paid";
    await booking.save();
  }

  notify(booking, emails.bookingConfirmed);
  res.status(201).json({ message: "Booking confirmed", booking });
};

exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.userId })
    .populate("service", "title price image category duration description")
    .populate("assignedStaff", "name image")
    .sort({ date: -1, timeSlot: -1 })
    .lean();
  res.json(bookings);
};

exports.cancelMyBooking = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.userId })
    .populate("service", "title")
    .populate("user", "username email");
  if (!booking) throw httpError(404, "Booking not found");
  if (!["pending", "confirmed"].includes(booking.status)) {
    throw httpError(400, `A ${booking.status} booking can't be cancelled.`);
  }
  if (dateToKey(booking.date) < todayKey()) throw httpError(400, "Past bookings can't be cancelled.");

  booking.status = "cancelled";
  booking.cancelledBy = "user";
  await booking.save();
  notify(booking, emails.bookingStatus);

  res.json({
    message:
      booking.paymentStatus === "paid"
        ? "Booking cancelled. Your refund will be processed within 5–7 working days."
        : "Booking cancelled.",
    booking,
  });
};

// ================== ADMIN ==================

exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find().populate(ADMIN_POPULATE).sort({ date: -1, timeSlot: 1 }).lean();
  res.json(bookings);
};

exports.assignStaff = async (req, res) => {
  const { bookingId, staffId } = req.body;
  const [booking, staff] = await Promise.all([Booking.findById(bookingId), Staff.findById(staffId)]);
  if (!booking) throw httpError(404, "Booking not found");
  if (!staff) throw httpError(404, "Staff member not found");
  if (staff.status !== "active") throw httpError(400, `${staff.name} is not an active staff member.`);
  if (booking.status === "cancelled") throw httpError(400, "Can't assign staff to a cancelled booking.");

  if (booking.timeSlot) {
    const clash = await Booking.exists({
      _id: { $ne: booking._id },
      assignedStaff: staff._id,
      date: booking.date,
      timeSlot: booking.timeSlot,
      status: { $ne: "cancelled" },
    });
    if (clash) throw httpError(409, `${staff.name} is already booked at ${booking.timeSlot} that day.`);
  }

  booking.assignedStaff = staff._id;
  if (booking.status === "pending") booking.status = "confirmed";
  await booking.save();
  await booking.populate(ADMIN_POPULATE);
  res.json({ message: `${staff.name} assigned`, booking });
};

exports.updateStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(ADMIN_POPULATE);
  if (!booking) throw httpError(404, "Booking not found");

  booking.status = req.body.status;
  booking.cancelledBy = req.body.status === "cancelled" ? "admin" : null;
  await booking.save();
  notify(booking, emails.bookingStatus);

  res.json({ message: `Booking marked ${booking.status}`, booking });
};

exports.updatePayment = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(ADMIN_POPULATE);
  if (!booking) throw httpError(404, "Booking not found");

  const wasPaid = booking.paymentStatus === "paid";
  booking.paymentStatus = req.body.paymentStatus;
  await booking.save();

  if (!wasPaid && booking.paymentStatus === "paid" && booking.user?.email) {
    const { subject, html } = emails.paymentReceived({
      name: booking.user.username,
      itemTitle: booking.service?.title,
      record: booking,
    });
    queueEmail(booking.user.email, subject, html);
  }

  res.json({ message: "Payment status updated", booking });
};
