const express = require("express");
const router = express.Router();
const orderController = require("../controllers/packageOrderController");
const VerifyUserToken = require("../middleware/VerifyUserToken");

// Create order
router.post("/place", VerifyUserToken, orderController.createOrder);

// Get all orders
router.get("/get-all", orderController.getAllOrders);

// Get my orders
router.get("/get", VerifyUserToken, orderController.getMyOrders);

// Use service (Admin)
router.patch("/use-service", orderController.useService);

// Assign staff
router.post("/assign-staff", orderController.assignStaffToService);

// Update payment status
router.patch("/update-payment/:id", orderController.updatePayment);

module.exports = router;
