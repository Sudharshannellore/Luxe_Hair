const Booking = require("../models/ServiceBooking");
const Order = require("../models/PackageOrder");
const emails = require("../templates/emails");
const { queueEmail } = require("../utils/sendEmail");
const { httpError } = require("../utils/httpError");
const { newTransactionId } = require("../utils/demoPayment");

// Demo online payments: the client shows a simulated checkout and then confirms here.
// No real money is charged — this exists for showcasing the full booking flow.

const load = async (type, id, userId) => {
  const doc =
    type === "booking"
      ? await Booking.findOne({ _id: id, user: userId }).populate("service").populate("user", "username email")
      : await Order.findOne({ _id: id, user: userId }).populate("package").populate("user", "username email");
  if (!doc) throw httpError(404, type === "booking" ? "Booking not found" : "Order not found");
  return doc;
};

// POST /payment/demo/confirm
exports.confirm = async (req, res) => {
  const { type, id, reference, instrument } = req.body;
  const doc = await load(type, id, req.userId);

  if (doc.paymentStatus === "paid") return res.json({ message: "Payment already confirmed", [type]: doc });
  if (doc.paymentMethod !== "online") throw httpError(400, "This purchase is set to pay at the salon.");
  if (!doc.paymentRef || doc.paymentRef !== reference) throw httpError(400, "Payment does not match this purchase.");
  if (doc.paymentStatus === "failed" || doc.status === "cancelled") {
    throw httpError(410, "This checkout expired. Please start the booking again.");
  }

  doc.paymentStatus = "paid";
  doc.transactionId = newTransactionId();
  doc.paymentInstrument = instrument;
  await doc.save();

  const name = doc.user?.username;
  const { subject, html } =
    type === "booking"
      ? emails.bookingConfirmed({ name, booking: doc, service: doc.service })
      : emails.orderConfirmed({ name, order: doc, pkg: doc.package });
  queueEmail(doc.user?.email, subject, html);

  res.json({
    message: type === "booking" ? "Payment received — booking confirmed" : "Payment received — combo activated",
    transactionId: doc.transactionId,
    [type]: doc,
  });
};

// POST /payment/demo/cancel — customer closed the checkout without paying. Frees the slot.
exports.cancel = async (req, res) => {
  const { type, id } = req.body;
  const doc = await load(type, id, req.userId);
  if (doc.paymentMethod !== "online" || doc.paymentStatus !== "pending") {
    return res.json({ message: "Nothing to cancel" });
  }
  doc.paymentStatus = "failed";
  doc.status = "cancelled";
  if (type === "booking") doc.cancelledBy = "system";
  await doc.save();
  res.json({ message: "Payment cancelled" });
};
