const mongoose = require("mongoose");

// Embedded review sub-document used by ServiceBooking and PackageOrder.
module.exports = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, default: "", maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);
