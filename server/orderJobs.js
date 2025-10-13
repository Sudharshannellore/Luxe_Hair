const cron = require("node-cron");
const Order = require("./models/PackageOrder");
const sendEmail = require("./utils/sendEmail");
const User = require("./models/User");
const Package = require("./models/Package");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(now.getDate() + 7);

  // Orders expiring in 7 days
  const expiringSoon = await Order.find({ expiryDate: { $lte: oneWeekLater, $gt: now }, status: "active" })
    .populate("user package");

  for (let order of expiringSoon) {
    const user = await User.findById(order.user);
    await sendEmail(user.email, "Package expiring soon", `Your package ${order.package.title} expires in 7 days.`);
  }

  // Orders expiring today
  const expiringToday = await Order.find({ expiryDate: { $lte: now }, status: "active" }).populate("user package");

  for (let order of expiringToday) {
    const user = await User.findById(order.user);
    await sendEmail(user.email, "Package expired", `Your package ${order.package.title} expired today.`);
    order.status = "expired";
    await order.save();
  }
});
