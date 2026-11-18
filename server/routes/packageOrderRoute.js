const express = require("express");
const c = require("../controllers/packageOrderController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// Customer
router.post("/place", requireUser, validate(s.createOrder), c.createOrder);
router.get("/get", requireUser, c.getMyOrders);

// Admin
router.get("/get-all", c.getAllOrders);
router.patch("/use-service", validate(s.useService), c.useService);
router.post("/assign-staff", validate(s.assignOrderStaff), c.assignStaffToService);
router.patch("/update-payment/:id", validate(s.paymentStatus), c.updatePayment);

module.exports = router;
