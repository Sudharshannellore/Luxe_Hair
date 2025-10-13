const Order = require("../models/PackageOrder");
const Package = require("../models/Package");
const User = require("../models/User");
const Staff = require("../models/Staff");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto"); // optional, only if needed elsewhere

const formatOrder = order => ({
  _id: order?._id || null,
  packageId: order?.package?._id || null,
  username: order?.user?.username || "Unknown User",
  packageTitle: order?.package?.title || "Unknown Package",
  orderDate: order?.orderDate || null,
  expiryDate: order?.expiryDate || null,
  paymentMethod: order?.paymentMethod || "N/A",
  paymentStatus: order?.paymentStatus || "N/A",
  price: order?.package?.price || 0,
  couponCode: order?.couponCode,
  discount: order?.discount,
  finalPrice: order?.finalPrice,
  servicesUsed: Array.isArray(order?.servicesUsed)
    ? order.servicesUsed.map(s => ({
        serviceName: s?.serviceName || "Unknown Service",
        used: !!s?.used,
        usedAt: s?.usedAt || null,
        assignedStaff: s?.assignedStaff || null,
      }))
    : [],
});

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { packageId, paymentMethod, couponCode, discount, finalAmount } = req.body;
    const userId = req.userId;

    if (!packageId || !paymentMethod) {
      return res.status(400).json({ message: "packageId and paymentMethod are required" });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    // Create Order in DB
    const order = await Order.create({
      user: userId,
      package: packageId,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod'?'pending':'paid',
      couponCode,
      discount,
      finalPrice: finalAmount
    });

    const user = await User.findById(userId);
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
        "Order Confirmation",
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
            <p><span class="highlight">You purchased:</span> ${pkg.title}</p>
            <p><span class="highlight">Payment:</span> ${paymentMethod}</p>
            <p><span class="highlight">Price:</span> ₹${pkg.price}</p>
             ${couponLine}
             ${discountLine}
             ${totalLine}
            <p><span class="highlight">Status:</span> ${order.paymentStatus}</p>
          </div>
          <p style="margin-top:25px;">Need help? Contact us anytime.</p>
        </div>
        <div class="foot">
          © 2025 luxe hair • 
        </div>
      </div>
    </body>
    </html>
    `
      );
    } catch (error) {
      console.error("Error sending email:", error);
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "username")
      .populate("package", "title price")
      .populate("servicesUsed.assignedStaff", "name email status")
      .sort({ updatedAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders for current user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("user", "username")
      .populate("package", "title price")
      .populate("servicesUsed.assignedStaff", "name email status")
      .sort({ updatedAt: -1 });

    const formattedOrders = orders.map(formatOrder);
    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Assign staff to a service inside an order
exports.assignStaffToService = async (req, res) => {
  try {
    const { orderId, serviceName, staffId } = req.body;

    const order = await Order.findById(orderId)
      .populate("user", "username email")
      .populate("package", "title price")
      .populate("servicesUsed.assignedStaff", "name email status");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const service = order.servicesUsed.find(s => s.serviceName === serviceName);
    if (!service) return res.status(404).json({ message: "Service not found in package" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (staff.status !== "active") {
      return res.status(400).json({ message: "Staff not available right now" });
    }

    service.assignedStaff = staff._id;
    await order.save();

    staff.status = "inactive";
    await staff.save();

    await order.populate("servicesUsed.assignedStaff", "name email status");

    res.json({
      message: `Staff assigned to ${serviceName}`,
      order: formatOrder(order)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Mark service as used and free up staff
exports.useService = async (req, res) => {
  try {
    const { orderId, serviceName } = req.body;

    const order = await Order.findById(orderId)
      .populate("user", "username email")
      .populate("package", "title price")
      .populate("servicesUsed.assignedStaff", "name email status");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const service = order.servicesUsed.find(s => s.serviceName === serviceName);
    if (!service) return res.status(404).json({ message: "Service not found in package" });
    if (service.used) return res.status(400).json({ message: "Service already used" });

    service.used = true;
    service.usedAt = new Date();

    // free up staff if assigned
    if (service.assignedStaff) {
      const staff = await Staff.findById(service.assignedStaff);
      if (staff) {
        staff.status = "active";
        await staff.save();
      }
    }

    await order.save();

        try {
          await sendEmail(
            order.User.email,
            "Service Used",
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
                  <h2>Service Used ✅</h2>
                  <p style="margin:5px 0 0;font-size:14px;">Here’s a summary of your service usage</p>
                </div>
                <div class="body">
                  <p>Hello <strong>${order.user.username || "User"}</strong>,</p>
                  <p>You used: <strong>${serviceName}</strong> from package <strong>${order.package.title}</strong>.</p>
                </div>
                <div class="foot">
                  © 2025 luxe hair •
                </div>
              </div>
            </body>
            </html>
        `
          );
        } catch (e) {
          console.error("Email error:", e.message);
        }

    await order.populate("servicesUsed.assignedStaff", "name email status");

    res.json({
      message: "Service marked as used",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true }
    )
      .populate("package", "title price")
      .populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.body.paymentStatus === "paid") {
      try {
          const couponLine = order.couponCode
            ? `<p><span class="highlight">Coupon Code:</span> ${order.couponCode}</p>`
            : "";
          const discountLine = order.discount
                            ? `<p><span class="highlight">Discount:</span> %${order.discount}</p>`  
                            : "";    
          const totalLine = order.finalPrice 
                            ? `<p><span class="highlight">Total Paid:</span> ₹${order.finalPrice}</p>`  
                            : "";
          await sendEmail(
            order.User.email,
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
                  <p>Hello <strong>${order.user.username || "User"}</strong>,</p>
                  <p>We’ve received your payment successfully. Here are your invoice details:</p>

                  <div class="info">
                    <p><span class="highlight">Package:</span> ${order.package.title}</p>
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
            </html>
            `
      );
    } catch (e) {
      console.error("Email error:", e.message);
    }
    }

    res.json({ message: "Payment updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
