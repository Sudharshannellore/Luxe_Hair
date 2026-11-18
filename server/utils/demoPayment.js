const crypto = require("crypto");

// Demo payment gateway: no real money moves. The client shows a simulated card/UPI
// checkout and then calls POST /payment/demo/confirm, which marks the purchase paid.
const ref = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const createDemoPayment = ({ type, id, amount, description, prefill }) => ({
  mode: "demo",
  reference: ref("DEMO"),
  type,
  id,
  amount, // rupees
  currency: "INR",
  description,
  prefill,
});

const newTransactionId = () => ref("TXN");

module.exports = { createDemoPayment, newTransactionId };
