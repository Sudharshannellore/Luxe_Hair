const express = require("express");
const c = require("../controllers/couponController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");
const { couponLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Public / customer
router.get("/active", c.getActiveCoupons);
router.post("/apply", requireUser, couponLimiter, validate(s.applyCoupon), c.applyCoupon);

// Admin
router.get("/get-all", c.getCoupons);
router.get("/get/:id", c.getCouponById);
router.post("/save", validate(s.coupon), c.createCoupon);
router.put("/update/:id", validate(s.couponUpdate), c.updateCoupon);
router.delete("/delete/:id", c.deleteCoupon);

module.exports = router;
