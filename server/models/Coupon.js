// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  offerName: { type: String, required: true },
  couponCode: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  minOrderValue: { type: Number, default: 0 },
  validityStart: { type: Date, required: true },
  validityEnd: { type: Date, required: true },
  eligibility: {
    type: String,
    enum: ["NEW_USERS", "INACTIVE_USERS", "ALL_USERS"],
    default: "ALL_USERS"
  },
  usageLimit: { type: String, enum: ["ONCE_PER_USER", "UNLIMITED"], default: "UNLIMITED" },
  status: { type: String, enum: ["ACTIVE", "EXPIRED", "DISABLED"], default: "ACTIVE" }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
