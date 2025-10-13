const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    price: { type: Number, required: true },
    services: { type: [String], default: [] },
    image: { type: String, default: "no-image.png" }, // file name saved
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
