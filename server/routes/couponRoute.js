// routes/couponRoutes.js
const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon, applyCoupon} = require("../controllers/couponController");
const VerifyUserToken = require("../middleware/VerifyUserToken");

// CRUD
router.post("/save", createCoupon);
router.get("/get-all", getCoupons);
router.get("/get/:id", getCouponById);
router.put("/update/:id", updateCoupon);
router.delete("/delete/:id", deleteCoupon);
router.post('/apply', VerifyUserToken, applyCoupon);

module.exports = router;
