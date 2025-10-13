const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  payment: {
    online: { type: Boolean, default: true },
    cod: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentSettings', settingsSchema);
