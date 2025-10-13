const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "no-image.png" }, // file name saved
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
