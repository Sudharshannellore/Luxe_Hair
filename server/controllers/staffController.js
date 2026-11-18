const Staff = require("../models/Staff");
const Booking = require("../models/ServiceBooking");
const { httpError } = require("../utils/httpError");
const { dateKeyToDate } = require("../utils/dates");

exports.createStaff = async (req, res) => {
  if (await Staff.exists({ email: req.body.email })) throw httpError(409, "A staff member with this email already exists.");
  const staff = await Staff.create({ ...req.body, image: req.file ? req.file.filename : "no-image.png" });
  res.status(201).json({ message: "Staff member added", staff });
};

exports.getAllStaff = async (req, res) => {
  res.json(await Staff.find().sort({ createdAt: -1 }).lean());
};

// Public: stylist cards for the website (no contact details).
exports.getPublicStaff = async (req, res) => {
  res.json(await Staff.find({ status: "active" }).select("name specialization experience image").sort({ createdAt: 1 }).lean());
};

// Active staff, optionally excluding those already booked for ?date=YYYY-MM-DD&timeSlot=HH:mm
exports.getActiveStaff = async (req, res) => {
  const { date, timeSlot } = req.query;
  let busy = [];
  if (date && timeSlot && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    busy = await Booking.distinct("assignedStaff", {
      date: dateKeyToDate(date),
      timeSlot,
      status: { $ne: "cancelled" },
      assignedStaff: { $ne: null },
    });
  }
  const staff = await Staff.find({ status: "active", _id: { $nin: busy } }).select("name specialization image").lean();
  res.json(staff);
};

exports.updateStaff = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw httpError(404, "Staff member not found");
  if (req.body.email && req.body.email !== staff.email && (await Staff.exists({ email: req.body.email }))) {
    throw httpError(409, "A staff member with this email already exists.");
  }
  Object.assign(staff, req.body);
  if (req.file) staff.image = req.file.filename;
  await staff.save();
  res.json({ message: "Staff member updated", staff });
};

exports.deleteStaff = async (req, res) => {
  const staff = await Staff.findByIdAndDelete(req.params.id);
  if (!staff) throw httpError(404, "Staff member not found");
  res.json({ message: "Staff member removed" });
};
