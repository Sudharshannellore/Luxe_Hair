// routes/serviceBookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/serviceBookingController");
const verifyUserToken = require("../middleware/VerifyUserToken");

// Create booking (logged-in user)
router.post("/create", verifyUserToken, bookingController.createBooking);


router.post("/assign-staff",  bookingController.assignStaff);

// Update booking status 
router.patch("/status/:id", bookingController.updateStatus);

// Update payment status 
router.patch("/payment/:id",  bookingController.updatePayment);

// Get all bookings 
router.get("/all", bookingController.getAllBookings);

// Get logged-in user's bookings
router.get("/my", verifyUserToken, bookingController.getUserBookings);

module.exports = router;
