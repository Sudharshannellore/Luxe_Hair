const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: "no-image.png" },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
