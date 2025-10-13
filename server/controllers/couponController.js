// controllers/couponController.js
const Coupon = require("../models/Coupon");
const ServiceBooking = require("../models/ServiceBooking");
const PackageOrder = require("../models/PackageOrder");

// Create Coupon
exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get All Coupons
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ updatedAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Coupon
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  const { code, orderValue } = req.body;

  try {
    const userId = req.userId;

    const coupon = await Coupon.findOne({ couponCode: code, status: "ACTIVE" });
    if (!coupon) return res.status(404).json({ error: "Invalid or inactive coupon" });

    const now = new Date();

    // 1. Date validation
    if (now < coupon.validityStart || now > coupon.validityEnd) {
      return res.status(400).json({ error: "Coupon expired or not yet valid" });
    }

    // 2. Minimum order value check
    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({ error: `Order must be at least ₹${coupon.minOrderValue}` });
    }

    // 3. Eligibility check
    if (coupon.eligibility === "NEW_USERS") {
      const bookingCount = await ServiceBooking.countDocuments({ user: userId });
      const orderCount = await PackageOrder.countDocuments({ user: userId });
      if (bookingCount > 0 || orderCount > 0) {
        return res.status(400).json({ error: "This coupon is valid only for new users (first order)" });
      }
    }

    if (coupon.eligibility === "INACTIVE_USERS") {
      const lastBooking = await ServiceBooking.findOne({ user: userId }).sort({ createdAt: -1 });
      const lastOrder = await PackageOrder.findOne({ user: userId }).sort({ createdAt: -1 });

      // Find latest activity
      let lastActivity = null;
      if (lastBooking && lastOrder) {
        lastActivity = lastBooking.createdAt > lastOrder.createdAt ? lastBooking.createdAt : lastOrder.createdAt;
      } else {
        lastActivity = lastBooking?.createdAt || lastOrder?.createdAt;
      }

      if (lastActivity) {
        const diffDays = Math.floor((now - new Date(lastActivity)) / (1000 * 60 * 60 * 24));
        if (diffDays < 90) {
          return res.status(400).json({ error: "This coupon is valid only if inactive for 90+ days" });
        }
      } else {
        // User has no orders at all → treat as new user (not inactive)
        return res.status(400).json({ error: "Not eligible: no purchase history (use Welcome Offer instead)" });
      }
    }

    // 4. Discount calculation
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    const finalAmount = orderValue - discount;

    res.status(200).json({
      code,
      discount,
      finalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
