const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    payment: {
      online: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.current = async function current() {
  return (await this.findOne()) || this.create({});
};

module.exports = mongoose.model("PaymentSettings", settingsSchema);
