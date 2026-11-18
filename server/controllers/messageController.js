const Message = require("../models/Message");
const { httpError } = require("../utils/httpError");

exports.createMessage = async (req, res) => {
  await Message.create(req.body);
  res.status(201).json({ message: "Thanks! We'll get back to you within 24 hours." });
};

exports.getAllMessages = async (req, res) => {
  res.json(await Message.find().sort({ createdAt: -1 }).lean());
};

exports.markRead = async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { read: req.body?.read !== false }, { new: true });
  if (!message) throw httpError(404, "Message not found");
  res.json({ message: "Updated", data: message });
};

exports.deleteMessage = async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) throw httpError(404, "Message not found");
  res.json({ message: "Message deleted" });
};
