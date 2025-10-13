const Message = require('../models/Message');


const createMessage = async (req, res) => {
  try {
    const { fullname, email, phone, message } = req.body;

    const newMessage = new Message({
      fullname,
      email,
      phone,
      message,
    });

      await newMessage.save();
    res.status(201).json({message : "Details Submitted Successfully"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createMessage, getAllMessages };
