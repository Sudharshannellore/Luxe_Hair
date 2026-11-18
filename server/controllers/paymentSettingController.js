const Settings = require("../models/PaymentSettings");

// Public: which payment methods customers may choose. "online" is the demo checkout.
exports.getSettings = async (req, res) => {
  const settings = await Settings.current();
  res.json({
    _id: settings._id,
    payment: { cod: settings.payment.cod, online: settings.payment.online },
    onlineMode: "demo",
    updatedAt: settings.updatedAt,
  });
};

exports.updatePaymentSettings = async (req, res) => {
  const settings = await Settings.current();
  if (typeof req.body.online === "boolean") settings.payment.online = req.body.online;
  if (typeof req.body.cod === "boolean") settings.payment.cod = req.body.cod;
  await settings.save();
  res.json({ message: "Payment settings updated", settings });
};
