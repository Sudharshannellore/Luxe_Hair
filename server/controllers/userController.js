const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/jwt');

// User Registration
exports.registerUser = async (req, res) => {
  const { username, email, password, phone } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const image = req.file ? req.file.filename : "no-image.png";

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      image
    });

    // Save user to DB
    await newUser.save();

    // Generate JWT
    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        image: newUser.image
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        image: user.image
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.userId; // /users/:id
  const { username, email, phone, password } = req.body;

  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    // Image update if file provided
    if (req.file) {
      user.image = req.file.filename;
    }

    // Password update if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        image: user.image
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};