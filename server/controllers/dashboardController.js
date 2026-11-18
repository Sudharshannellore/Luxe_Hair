const ServiceBooking = require("../models/ServiceBooking");
const PackageOrder = require("../models/PackageOrder");
const User = require("../models/User");
const Message = require("../models/Message");
const config = require("../config");
const { dateKeyToDate, todayKey } = require("../utils/dates");

const PAID = { paymentStatus: "paid" };
const tz = config.timezone;

// Revenue per month for paid bookings + paid combo orders.
const monthly = (Model, priceExpr) =>
  Model.aggregate([
    { $match: PAID },
    {
      $group: {
        _id: { year: { $year: { date: "$createdAt", timezone: tz } }, month: { $month: { date: "$createdAt", timezone: tz } } },
        total: { $sum: priceExpr },
        count: { $sum: 1 },
      },
    },
  ]);

const bookingPrice = { $ifNull: ["$finalPrice", "$price"] };
const orderPrice = { $ifNull: ["$finalPrice", { $ifNull: ["$price", 0] }] };

exports.getStats = async (req, res) => {
  const today = dateKeyToDate(todayKey());

  const [
    serviceMonthly,
    packageMonthly,
    totalServiceBookings,
    totalPackageOrders,
    totalCustomers,
    unreadMessages,
    pendingPayments,
    statusBreakdown,
    topServices,
    todayServiceBookings,
  ] = await Promise.all([
    monthly(ServiceBooking, bookingPrice),
    monthly(PackageOrder, orderPrice),
    ServiceBooking.countDocuments(),
    PackageOrder.countDocuments({ paymentStatus: { $ne: "failed" } }),
    User.countDocuments(),
    Message.countDocuments({ read: { $ne: true } }),
    ServiceBooking.countDocuments({ paymentStatus: "pending", status: { $ne: "cancelled" } }),
    ServiceBooking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ServiceBooking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$service", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, bookingPrice, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
      { $unwind: "$service" },
      { $project: { _id: 0, serviceId: "$_id", title: "$service.title", count: 1, revenue: 1 } },
    ]),
    ServiceBooking.find({ date: today, status: { $ne: "cancelled" } })
      .populate("service", "title duration")
      .populate("user", "username phone")
      .populate("assignedStaff", "name")
      .select("date timeSlot status paymentStatus service user assignedStaff")
      .sort({ timeSlot: 1 })
      .lean(),
  ]);

  // Merge service + package revenue by month.
  const map = new Map();
  for (const [rows, key] of [
    [serviceMonthly, "services"],
    [packageMonthly, "combos"],
  ]) {
    for (const r of rows) {
      const id = `${r._id.year}-${r._id.month}`;
      const entry = map.get(id) || { year: r._id.year, month: r._id.month, total: 0, services: 0, combos: 0 };
      entry[key] += r.total;
      entry.total += r.total;
      map.set(id, entry);
    }
  }
  const monthlyRevenue = [...map.values()].sort((a, b) => a.year - b.year || a.month - b.month);

  const [y, m] = todayKey().split("-").map(Number);
  const prev = m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
  const find = ({ year, month }) => monthlyRevenue.find((r) => r.year === year && r.month === month)?.total || 0;

  res.json({
    totalRevenue: monthlyRevenue.reduce((sum, r) => sum + r.total, 0),
    thisMonthRevenue: find({ year: y, month: m }),
    previousMonthRevenue: find(prev),
    monthlyRevenue,
    totalServiceBookings,
    totalPackageOrders,
    totalCustomers,
    unreadMessages,
    pendingPayments,
    statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
    topServices,
    todayServiceBookings,
  });
};
