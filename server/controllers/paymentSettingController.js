const Settings = require('../models/PaymentSettings');

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne() || await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const { online, cod } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({ payment: {} });

    if (typeof online === 'boolean') settings.payment.online = online;
    if (typeof cod === 'boolean') settings.payment.cod = cod;

    await settings.save();
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
