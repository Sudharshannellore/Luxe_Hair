const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    username: { type:String, required: true },
    email: { type:String, required: true, unique: true },
    password: { type:String, required: true },
    phone: { type: String }, 
    image: { type: String, default: "no-image.png" },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
