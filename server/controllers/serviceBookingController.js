const mongoose = require("mongoose");
const Booking = require("../models/ServiceBooking");
const Service = require("../models/Service");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Staff = require("../models/Staff");
const crypto = require("crypto");

// ================== CREATE BOOKING ==================
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, paymentMethod, date, couponCode, discount, finalAmount } = req.body;
    const userId = req.userId;

    if (!serviceId || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "serviceId and paymentMethod are required" });
    }

    const user = await User.findById(userId).select("email name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    // Create booking (no online payments now)
    const booking = await Booking.create({
      user: userId,
      service: serviceId,
      date,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod'? 'pending' : 'paid',
      price: service.price,
      couponCode: couponCode,
      discount: discount,
      finalPrice: finalAmount,
    });

    // Send confirmation email
    try {
    const couponLine = couponCode
      ? `<p><span class="highlight">Coupon Code:</span> ${couponCode}</p>`
      : "";
    const discountLine = discount
                      ? `<p><span class="highlight">Discount:</span> %${discount}</p>`  
                      : "";    
    const totalLine = finalAmount 
                      ? `<p><span class="highlight">Total Paid:</span> ₹${finalAmount}</p>`  
                      : "";       
      await sendEmail(
        user.email,
        "Booking Confirmation",
        `   
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0;padding:0;color:#333;}
        .mail {max-width:600px;margin:30px auto;background:#fff;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,.08);overflow:hidden;}
        .head {background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;text-align:center;padding:25px;}
        .head h2 {margin:0;font-size:22px;}
        .body {padding:25px;}
        .info {background:#f9fafc;border-radius:8px;padding:15px 20px;margin:20px 0;}
        .info p {margin:6px 0;font-size:15px;}
        .highlight {color:#16a34a;font-weight:600;}
        .btn {display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;margin-top:10px;}
        .btn:hover {background:#15803d;}
        .foot {text-align:center;font-size:13px;color:#777;border-top:1px solid #eee;padding:15px;}
      </style>
    </head>
    <body>
      <div class="mail">
        <div class="head">
          <h2>Booking Confirmed 🎉</h2>
          <p style="margin:5px 0 0;font-size:14px;">Thanks for choosing us!</p>
        </div>
        <div class="body">
          <p>Hello <strong>${user.name || "User"}</strong>,</p>
          <p>Your booking has been successfully confirmed.</p>

          <div class="info">
            <p><span class="highlight">Service:</span> ${service.title}</p>
            <p><span class="highlight">Payment:</span> ${paymentMethod}</p>
            <p><span class="highlight">Price:</span> ₹${service.price}</p>
             ${couponLine}
             ${discountLine}
             ${totalLine}
            <p><span class="highlight">Status:</span> ${booking.paymentStatus}</p>
          </div>
          <p style="margin-top:25px;">Need help? Contact us anytime.</p>
        </div>
        <div class="foot">
          © 2025 luxe hair • 
        </div>
      </div>
    </body>
    </html>`
      );
    } catch (emailErr) {
      console.error("Email error:", emailErr.message);
    }

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================== ASSIGN STAFF ==================
exports.assignStaff = async (req, res) => {
  try {
    const { bookingId, staffId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email")
      .populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (staff.status !== "active") {
      return res.status(400).json({ message: "Staff not available right now" });
    }

    booking.assignedStaff = staff._id;
    await booking.save();

    staff.status = "inactive";
    await staff.save();

    res.json({ message: "Staff assigned successfully", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================== UPDATE STATUS ==================
exports.updateStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
      .populate("service")
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.body.status === "completed" && booking.assignedStaff) {
      const staff = await Staff.findById(booking.assignedStaff);
      if (staff) {
        staff.status = "active";
        await staff.save();
      }
    }

    try {
      await sendEmail(
        booking.user.email,
        "Booking Status Updated",
        `    
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0;padding:0;color:#333;}
        .mail {max-width:600px;margin:30px auto;background:#fff;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,.08);overflow:hidden;}
        .head {background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;text-align:center;padding:25px;}
        .head h2 {margin:0;font-size:22px;}
        .body {padding:25px;}
        .body p {font-size:16px;line-height:1.6;margin:12px 0;}
        .btn {display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;margin-top:15px;}
        .btn:hover {background:#15803d;}
        .foot {text-align:center;font-size:13px;color:#777;border-top:1px solid #eee;padding:15px;}
      </style>
    </head>
    <body>
      <div class="mail">
        <div class="head">
          <h2>Booking Status Updated 📌</h2>
          <p style="margin:5px 0 0;font-size:14px;">Stay updated on your booking</p>
        </div>
        <div class="body">
          <p>Hello <strong>${booking.user.username || "User"}</strong>,</p>
          <p>Your booking for <strong>${booking.service.title}</strong> is now <strong>${booking.status}</strong>.</p>
        </div>
        <div class="foot">
          © 2025 luxe hair •
        </div>
      </div>
    </body>
    </html>`
      );
    } catch (e) {
      console.error("Email error:", e.message);
    }

    res.json({ message: "Status updated", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================== UPDATE PAYMENT ==================
exports.updatePayment = async (req, res) => {
  try {

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true }
    )
      .populate("service")
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.body.paymentStatus === "paid") {
      try {
          const couponLine = booking.couponCode
            ? `<p><span class="highlight">Coupon Code:</span> ${booking.couponCode}</p>`
            : "";
          const discountLine = booking.discount
                            ? `<p><span class="highlight">Discount:</span> %${booking.discount}</p>`  
                            : "";    
          const totalLine = booking.finalPrice 
                            ? `<p><span class="highlight">Total Paid:</span> ₹${booking.finalPrice}</p>`  
                            : "";        
        await sendEmail(
          booking.user.email,
          "Payment Invoice",
          `           
           <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8" />
              <style>
                body {font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0;padding:0;color:#333;}
                .mail {max-width:600px;margin:30px auto;background:#fff;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,.08);overflow:hidden;}
                .head {background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;text-align:center;padding:25px;}
                .head h2 {margin:0;font-size:22px;}
                .body {padding:25px;}
                .info {background:#f9fafc;border-radius:8px;padding:15px 20px;margin:20px 0;}
                .info p {margin:6px 0;font-size:15px;}
                .highlight {color:#16a34a;font-weight:600;}
                .btn {display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;margin-top:10px;}
                .btn:hover {background:#15803d;}
                .foot {text-align:center;font-size:13px;color:#777;border-top:1px solid #eee;padding:15px;}
              </style>
            </head>
            <body>
              <div class="mail">
                <div class="head">
                  <h2>Payment Successful 💚</h2>
                  <p style="margin:5px 0 0;font-size:14px;">Thank you for your payment!</p>
                </div>
                <div class="body">
                  <p>Hello <strong>${booking.user.username || "User"}</strong>,</p>
                  <p>We’ve received your payment successfully. Here are your invoice details:</p>

                  <div class="info">
                    <p><span class="highlight">Service:</span> ${booking.service.title}</p>
                    <p><span class="highlight">Price:</span> ₹${booking.price}</p>
                    ${couponLine}
                    ${discountLine}
                    ${totalLine}
                    <p><span class="highlight">Status:</span> Paid ✅</p>
                  </div>

                  <p style="margin-top:25px;">We appreciate your business!</p>
                </div>
                <div class="foot">
                  © 2025 luxe hair •
                </div>
              </div>
            </body>
            </html>`
        );
      } catch (e) {
        console.error("Email error:", e.message);
      }
    }

    res.json({ message: "Payment updated", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================== GET ALL BOOKINGS ==================
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("service")
      .populate("user", "username email")
      .populate("assignedStaff", "name email status")
      .sort({ updatedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================== GET USER BOOKINGS ==================
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate("service")
      .populate("assignedStaff", "name status")
      .sort({ updatedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
