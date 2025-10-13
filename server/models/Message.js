const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    fullname: { type:String, required: true },
    email: { type:String, required: true, unique: true },
    phone: { type: String, required: true }, 
    message:{ type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
