const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "online"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  price: { type: Number, required: true },
  couponCode: {type:String},
  discount: {type:Number},
  finalPrice:{type:Number},
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null }, // new
  reviews: {
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, required: true }
      }
    ],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("ServiceBooking", bookingSchema);
