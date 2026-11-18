const Coupon = require("../models/Coupon");
const Service = require("../models/Service");
const Package = require("../models/Package");
const { applyCoupon } = require("../utils/pricing");
const { httpError } = require("../utils/httpError");

const PUBLIC_FIELDS =
  "offerName description couponCode discountType discountValue maxDiscount minOrderValue eligibility usageLimit validityEnd";

// ================== ADMIN ==================

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ message: "Coupon created", coupon });
};

exports.getCoupons = async (req, res) => {
  res.json(await Coupon.find().sort({ updatedAt: -1 }).lean());
};

exports.getCouponById = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).lean();
  if (!coupon) throw httpError(404, "Coupon not found");
  res.json(coupon);
};

exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw httpError(404, "Coupon not found");
  Object.assign(coupon, req.body);

  if (coupon.validityEnd <= coupon.validityStart) throw httpError(400, "End date must be after start date");
  if (coupon.discountType === "PERCENTAGE" && coupon.discountValue > 100) {
    throw httpError(400, "Percentage discount cannot exceed 100");
  }
  // Re-activating a coupon whose end date is still in the future.
  if (coupon.status === "EXPIRED" && coupon.validityEnd > new Date() && req.body.status === "ACTIVE") coupon.status = "ACTIVE";

  await coupon.save();
  res.json({ message: "Coupon updated", coupon });
};

exports.deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw httpError(404, "Coupon not found");
  res.json({ message: "Coupon deleted" });
};

// ================== PUBLIC / CUSTOMER ==================

// Only coupons a customer could actually use right now.
exports.getActiveCoupons = async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ status: "ACTIVE", validityStart: { $lte: now }, validityEnd: { $gte: now } })
    .select(PUBLIC_FIELDS)
    .sort({ validityEnd: 1 })
    .lean();
  res.json(coupons);
};

// Preview the discount. The final price is recomputed again when the booking/order is created.
exports.applyCoupon = async (req, res) => {
  const { code, serviceId, packageId } = req.body;
  let orderValue = req.body.orderValue;

  if (serviceId) {
    const service = await Service.findById(serviceId).select("price").lean();
    if (!service) throw httpError(404, "Service not found");
    orderValue = service.price;
  } else if (packageId) {
    const pkg = await Package.findById(packageId).select("price").lean();
    if (!pkg) throw httpError(404, "Combo not found");
    orderValue = pkg.price;
  }

  const result = await applyCoupon({ code, userId: req.userId, orderValue });
  res.json({
    code: result.code,
    offerName: result.coupon.offerName,
    orderValue,
    discount: result.discount,
    finalAmount: result.finalAmount,
  });
};
