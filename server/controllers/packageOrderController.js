const Order = require("../models/PackageOrder");
const Package = require("../models/Package");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Settings = require("../models/PaymentSettings");
const { createDemoPayment } = require("../utils/demoPayment");
const emails = require("../templates/emails");
const { queueEmail } = require("../utils/sendEmail");
const { quote } = require("../utils/pricing");
const { httpError } = require("../utils/httpError");

const ADMIN_POPULATE = [
  { path: "user", select: "username email phone image" },
  { path: "package", select: "title price image services" },
  { path: "servicesUsed.assignedStaff", select: "name email image status" },
];

const isExpired = (order) => order.status === "expired" || (order.expiryDate && new Date(order.expiryDate) < new Date());

// Shape returned to customers on their profile page.
const formatOrder = (order) => {
  const services = (order.servicesUsed || []).map((s) => ({
    _id: s._id,
    serviceName: s.serviceName,
    used: !!s.used,
    usedAt: s.usedAt || null,
    assignedStaff: s.assignedStaff ? { _id: s.assignedStaff._id, name: s.assignedStaff.name } : null,
  }));
  return {
    _id: order._id,
    packageId: order.package?._id || null,
    packageTitle: order.package?.title || "Combo",
    packageImage: order.package?.image || null,
    orderDate: order.orderDate,
    expiryDate: order.expiryDate,
    status: isExpired(order) ? "expired" : order.status || "active",
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    price: order.price ?? order.package?.price ?? 0,
    couponCode: order.couponCode || null,
    discount: order.discount || 0,
    finalPrice: order.finalPrice ?? order.price ?? order.package?.price ?? 0,
    servicesUsed: services,
    usedCount: services.filter((s) => s.used).length,
    totalCount: services.length,
  };
};

const ensurePaymentMethodAllowed = async (method) => {
  const settings = await Settings.current();
  if (method === "cod" && !settings.payment.cod) throw httpError(400, "Pay at salon is currently unavailable.");
  if (method === "online" && !settings.payment.online) {
    throw httpError(400, "Online payment is currently unavailable.");
  }
};

// ================== CUSTOMER ==================

exports.createOrder = async (req, res) => {
  const { packageId, paymentMethod, couponCode } = req.body;
  await ensurePaymentMethodAllowed(paymentMethod);

  const [user, pkg] = await Promise.all([User.findById(req.userId), Package.findById(packageId)]);
  if (!user) throw httpError(404, "User not found");
  if (!pkg) throw httpError(404, "Combo not found");

  const price = await quote({ price: pkg.price, couponCode, userId: user._id });

  const order = await Order.create({
    user: user._id,
    package: pkg._id,
    paymentMethod,
    paymentStatus: "pending",
    expiryDate: new Date(Date.now() + (pkg.validityDays || 30) * 86400000),
    ...price,
  });

  if (paymentMethod === "online" && order.finalPrice > 0) {
    const payment = createDemoPayment({
      type: "order",
      id: order._id,
      amount: order.finalPrice,
      description: pkg.title,
      prefill: { name: user.username, email: user.email, contact: user.phone || "" },
    });
    order.paymentRef = payment.reference;
    await order.save();
    return res.status(201).json({ message: "Complete the payment to activate your combo", order, payment });
  }

  if (paymentMethod === "online") {
    order.paymentStatus = "paid";
    await order.save();
  }

  const { subject, html } = emails.orderConfirmed({ name: user.username, order, pkg });
  queueEmail(user.email, subject, html);
  res.status(201).json({ message: "Combo purchased", order });
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.userId, paymentStatus: { $ne: "failed" } })
    .populate("package", "title price image")
    .populate("servicesUsed.assignedStaff", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders.map(formatOrder));
};

// ================== ADMIN ==================

exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().populate(ADMIN_POPULATE).sort({ createdAt: -1 }).lean();
  res.json(orders.map((o) => ({ ...o, status: isExpired(o) && o.status === "active" ? "expired" : o.status || "active" })));
};

exports.assignStaffToService = async (req, res) => {
  const { orderId, serviceName, staffId } = req.body;
  const [order, staff] = await Promise.all([Order.findById(orderId), Staff.findById(staffId)]);
  if (!order) throw httpError(404, "Order not found");
  if (!staff) throw httpError(404, "Staff member not found");
  if (staff.status !== "active") throw httpError(400, `${staff.name} is not an active staff member.`);

  const service = order.servicesUsed.find((s) => s.serviceName === serviceName);
  if (!service) throw httpError(404, "Service not found in this combo");
  if (service.used) throw httpError(400, "This service has already been used.");

  service.assignedStaff = staff._id;
  await order.save();
  await order.populate(ADMIN_POPULATE);
  res.json({ message: `${staff.name} assigned to ${serviceName}`, order });
};

exports.useService = async (req, res) => {
  const { orderId, serviceName } = req.body;
  const order = await Order.findById(orderId).populate(ADMIN_POPULATE);
  if (!order) throw httpError(404, "Order not found");
  if (order.status === "cancelled") throw httpError(400, "This order was cancelled.");
  if (isExpired(order)) throw httpError(400, "This combo has expired.");

  const service = order.servicesUsed.find((s) => s.serviceName === serviceName);
  if (!service) throw httpError(404, "Service not found in this combo");
  if (service.used) throw httpError(400, "Service already used");

  service.used = true;
  service.usedAt = new Date();
  await order.save();

  if (order.user?.email) {
    const { subject, html } = emails.serviceUsed({
      name: order.user.username,
      serviceName,
      pkg: order.package,
      remaining: order.servicesUsed.filter((s) => !s.used).length,
    });
    queueEmail(order.user.email, subject, html);
  }

  res.json({ message: `${serviceName} marked as used`, order });
};

exports.updatePayment = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(ADMIN_POPULATE);
  if (!order) throw httpError(404, "Order not found");

  const wasPaid = order.paymentStatus === "paid";
  order.paymentStatus = req.body.paymentStatus;
  await order.save();

  if (!wasPaid && order.paymentStatus === "paid" && order.user?.email) {
    const { subject, html } = emails.paymentReceived({
      name: order.user.username,
      itemTitle: order.package?.title,
      record: { ...order.toObject(), price: order.price ?? order.package?.price },
    });
    queueEmail(order.user.email, subject, html);
  }

  res.json({ message: "Payment status updated", order });
};

exports.formatOrder = formatOrder;
