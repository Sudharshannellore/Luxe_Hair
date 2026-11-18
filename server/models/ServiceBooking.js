const mongoose = require("mongoose");
const reviewSchema = require("./review");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    // Calendar day stored as UTC midnight (see utils/dates.js) + "HH:mm" slot.
    date: { type: Date, required: true },
    timeSlot: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    cancelledBy: { type: String, enum: ["user", "admin", "system", null], default: null },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentRef: { type: String }, // demo checkout reference
    transactionId: { type: String }, // set when the demo payment is confirmed
    paymentInstrument: { type: String }, // e.g. "Visa •••• 4242" or "UPI ann@okbank"
    price: { type: Number, required: true },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ date: 1, timeSlot: 1, status: 1 });
bookingSchema.index({ assignedStaff: 1, date: 1, timeSlot: 1 });
bookingSchema.index({ paymentRef: 1 }, { sparse: true });

module.exports = mongoose.model("ServiceBooking", bookingSchema);
