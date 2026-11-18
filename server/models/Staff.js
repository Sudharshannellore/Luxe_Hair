const mongoose = require("mongoose");

// status = employment status (active staff can be assigned). Availability for a
// particular time slot is derived from bookings, not stored on the staff member.
const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    experience: { type: String, required: true },
    specialization: { type: String, required: true },
    address: { type: String, required: true },
    image: { type: String, default: "no-image.png" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
