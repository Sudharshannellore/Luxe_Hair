const Staff = require('../models/Staff');

// Create/Register Staff
exports.createStaff = async (req, res) => {
  const { name, email, phone, experience, specialization, address } = req.body;
  try {
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) return res.status(400).json({ message: 'Staff already exists' });

    const image = req.file ? req.file.filename : 'no-image.png';

    const newStaff = new Staff({
      name,
      email,
      phone,
      experience,
      specialization,
      address,
      image,
    });

    await newStaff.save();
    res.status(201).json({ message: 'Staff created successfully', staff: newStaff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json(staffList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get staff by status (only name and _id)
exports.getStaffByStatus = async (req, res) => {
  try {

    // only fetch name and _id fields
    const staffList = await Staff.find({ status: 'active' }).select('name _id');

    if (!staffList || staffList.length === 0) {
      return res
        .status(404)
        .json({ message: 'No staff found with status' });
    }

    res.status(200).json(staffList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Update Staff
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, phone, experience, specialization, address } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    if (name) staff.name = name;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (experience) staff.experience = experience;
    if (specialization) staff.specialization = specialization; // single string
    if (address) staff.address = address;
    if (req.file) staff.image = req.file.filename;

    await staff.save();
    res.status(200).json({ message: 'Staff updated successfully', staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete staff 
exports.deleteStaff = async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) return res.status(404).json({ message: 'Staff not found' });

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

