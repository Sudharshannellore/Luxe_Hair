const express = require("express");
const c = require("../controllers/serviceBookingController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// Customer
router.get("/slots", c.getSlots);
router.post("/create", requireUser, validate(s.createBooking), c.createBooking);
router.get("/my", requireUser, c.getUserBookings);
router.patch("/cancel/:id", requireUser, c.cancelMyBooking);

// Admin
router.get("/all", c.getAllBookings);
router.post("/assign-staff", validate(s.assignBookingStaff), c.assignStaff);
router.patch("/status/:id", validate(s.bookingStatus), c.updateStatus);
router.patch("/payment/:id", validate(s.paymentStatus), c.updatePayment);

module.exports = router;
