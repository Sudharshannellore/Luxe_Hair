const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
  name: { type:String, required: true },
  email: { type:String, required: true, unique: true },
  phone: { type: String, required: true }, 
  experience:{ type: String, required: true },
  specialization:{ type: String, required: true },
  address:{ type: String, required: true },
  image: { type: String, default: "no-image.png" },

  // NEW FIELD
  status: { 
    type: String, 
    enum: ['active','inactive'], 
    default: 'active' 
  }
},{timestamps:true});


module.exports = mongoose.model('Staff', staffSchema);
