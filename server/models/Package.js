const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    services: { type: [String], default: [] },
    image: { type: String, default: "no-image.png" },
    features: { type: [String], default: [] },
    validityDays: { type: Number, default: 30, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
