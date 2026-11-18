const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { httpError } = require("../utils/httpError");

exports.registerUser = async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (await User.exists({ email })) throw httpError(409, "An account with this email already exists.");

  const user = await User.create({
    username,
    email,
    phone,
    password: await bcrypt.hash(password, 10),
    image: req.file ? req.file.filename : "no-image.png",
  });

  res.status(201).json({ message: "Account created", token: generateToken(user._id), user: user.toPublic() });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, "Incorrect email or password.");
  }
  res.json({ message: "Signed in", token: generateToken(user._id), user: user.toPublic() });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, "User not found");
  res.json({ user: user.toPublic() });
};

exports.updateUser = async (req, res) => {
  const { username, email, phone, password } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, "User not found");

  if (email && email !== user.email) {
    if (await User.exists({ email, _id: { $ne: user._id } })) throw httpError(409, "That email is already in use.");
    user.email = email;
  }
  if (username) user.username = username;
  if (phone !== undefined) user.phone = phone;
  if (req.file) user.image = req.file.filename;
  if (password) user.password = await bcrypt.hash(password, 10);

  await user.save();
  res.json({ message: "Profile updated", user: user.toPublic() });
};
