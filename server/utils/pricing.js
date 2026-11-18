const Coupon = require("../models/Coupon");
const ServiceBooking = require("../models/ServiceBooking");
const PackageOrder = require("../models/PackageOrder");
const { httpError } = require("./httpError");

const round2 = (n) => Math.round(n * 100) / 100;

// Purchases that count for "has this user bought before" checks.
const purchaseFilter = (userId) => ({
  user: userId,
  status: { $ne: "cancelled" },
  paymentStatus: { $ne: "failed" },
});

/**
 * Validates a coupon for a user and order value and returns the discount.
 * All prices are computed here on the server; the client never sends amounts.
 */
const applyCoupon = async ({ code, userId, orderValue }) => {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) throw httpError(400, "Enter a coupon code.");

  const coupon = await Coupon.findOne({ couponCode: normalized, status: "ACTIVE" });
  if (!coupon) throw httpError(404, "Invalid or inactive coupon.");

  const now = new Date();
  if (now < coupon.validityStart || now > coupon.validityEnd) {
    throw httpError(400, "This coupon has expired or is not active yet.");
  }

  if (orderValue < (coupon.minOrderValue || 0)) {
    throw httpError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);
  }

  const filter = purchaseFilter(userId);

  if (coupon.eligibility === "NEW_USERS") {
    const [b, o] = await Promise.all([ServiceBooking.countDocuments(filter), PackageOrder.countDocuments(filter)]);
    if (b + o > 0) throw httpError(400, "This coupon is only valid on your first booking.");
  }

  if (coupon.eligibility === "INACTIVE_USERS") {
    const [lastBooking, lastOrder] = await Promise.all([
      ServiceBooking.findOne(filter).sort({ createdAt: -1 }).select("createdAt").lean(),
      PackageOrder.findOne(filter).sort({ createdAt: -1 }).select("createdAt").lean(),
    ]);
    const dates = [lastBooking?.createdAt, lastOrder?.createdAt].filter(Boolean).map((d) => new Date(d).getTime());
    if (!dates.length) {
      throw httpError(400, "This coupon is for returning customers. Try our welcome offer instead.");
    }
    const days = Math.floor((now.getTime() - Math.max(...dates)) / 86400000);
    if (days < 90) throw httpError(400, "This coupon is for customers who haven't visited in 90+ days.");
  }

  if (coupon.usageLimit === "ONCE_PER_USER") {
    const [b, o] = await Promise.all([
      ServiceBooking.countDocuments({ ...filter, couponCode: normalized }),
      PackageOrder.countDocuments({ ...filter, couponCode: normalized }),
    ]);
    if (b + o > 0) throw httpError(400, "You have already used this coupon.");
  }

  let discount =
    coupon.discountType === "PERCENTAGE" ? (orderValue * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.discountType === "PERCENTAGE" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(Math.max(discount, 0), orderValue));

  return { code: normalized, coupon, discount, finalAmount: round2(orderValue - discount) };
};

/** Server-side price for a purchase, with an optional coupon. */
const quote = async ({ price, couponCode, userId }) => {
  if (!couponCode) return { price, couponCode: undefined, discount: 0, finalPrice: price };
  const { code, discount, finalAmount } = await applyCoupon({ code: couponCode, userId, orderValue: price });
  return { price, couponCode: code, discount, finalPrice: finalAmount };
};

module.exports = { applyCoupon, quote, round2 };
