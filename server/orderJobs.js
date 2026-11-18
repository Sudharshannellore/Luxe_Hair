const cron = require("node-cron");
const Order = require("./models/PackageOrder");
const Booking = require("./models/ServiceBooking");
const Coupon = require("./models/Coupon");
const config = require("./config");
const emails = require("./templates/emails");
const { sendEmail } = require("./utils/sendEmail");

const STALE_PAYMENT_MINUTES = 30;

// Combo orders: remind 7 days before expiry (once), then mark expired.
const runExpiryJob = async () => {
  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 86400000);

  const expiringSoon = await Order.find({
    status: { $nin: ["expired", "cancelled"] },
    paymentStatus: { $ne: "failed" },
    expiryReminderSent: { $ne: true },
    expiryDate: { $gt: now, $lte: inAWeek },
  }).populate("user package");

  for (const order of expiringSoon) {
    if (order.user?.email && order.package) {
      const { subject, html } = emails.packageExpiring({ name: order.user.username, pkg: order.package, order });
      await sendEmail(order.user.email, subject, html);
    }
    order.expiryReminderSent = true;
    await order.save();
  }

  const expired = await Order.find({
    status: { $nin: ["expired", "cancelled"] },
    paymentStatus: { $ne: "failed" },
    expiryDate: { $lte: now },
  }).populate("user package");

  for (const order of expired) {
    if (order.user?.email && order.package) {
      const { subject, html } = emails.packageExpired({ name: order.user.username, pkg: order.package });
      await sendEmail(order.user.email, subject, html);
    }
    order.status = "expired";
    await order.save();
  }

  const coupons = await Coupon.updateMany({ status: "ACTIVE", validityEnd: { $lt: now } }, { status: "EXPIRED" });

  console.log(
    `[jobs] expiry: ${expiringSoon.length} reminders, ${expired.length} expired orders, ${coupons.modifiedCount} expired coupons`
  );
};

// Online checkouts the customer abandoned: release the slot / order after 30 minutes.
const runStalePaymentJob = async () => {
  const cutoff = new Date(Date.now() - STALE_PAYMENT_MINUTES * 60000);
  const stale = { paymentMethod: "online", paymentStatus: "pending", createdAt: { $lt: cutoff } };
  const [b, o] = await Promise.all([
    Booking.updateMany(stale, { paymentStatus: "failed", status: "cancelled", cancelledBy: "system" }),
    Order.updateMany(stale, { paymentStatus: "failed", status: "cancelled" }),
  ]);
  if (b.modifiedCount || o.modifiedCount) {
    console.log(`[jobs] released ${b.modifiedCount} unpaid bookings and ${o.modifiedCount} unpaid orders`);
  }
};

const safe = (name, fn) => async () => {
  try {
    await fn();
  } catch (err) {
    console.error(`[jobs] ${name} failed:`, err);
  }
};

// Render's free tier sleeps a web service after ~15 min without inbound traffic.
// Pinging our own PUBLIC url (not localhost) every 5 min counts as traffic and keeps it awake.
// Render sets RENDER_EXTERNAL_URL automatically; KEEP_ALIVE_URL overrides it (e.g. a custom domain).
const runKeepAliveJob = async () => {
  const base = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!base) return;
  // A real read, so Atlas counts it as activity (it pauses idle free M0 clusters after 60 days).
  await Order.findOne().select("_id").lean();
  const res = await fetch(`${base.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(20000) });
  console.log(`[jobs] keep-alive ping -> ${res.status}`);
};

const startJobs = () => {
  cron.schedule("0 9 * * *", safe("expiry", runExpiryJob), { timezone: config.timezone });
  cron.schedule("*/10 * * * *", safe("stale-payments", runStalePaymentJob), { timezone: config.timezone });
  cron.schedule("*/5 * * * *", safe("keep-alive", runKeepAliveJob));
  console.log("[jobs] scheduled: combo expiry (daily 09:00), unpaid checkout cleanup (every 10 min), keep-alive (every 5 min)");
};

module.exports = { startJobs, runExpiryJob, runStalePaymentJob, runKeepAliveJob };
