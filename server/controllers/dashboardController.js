// controllers/dashboardController.js
const ServiceBooking = require("../models/ServiceBooking");
const Package = require("../models/Package");
const PackageOrder = require("../models/PackageOrder");

// Helper: get combined monthly revenue
const getMonthlyRevenue = async () => {
  // Service monthly revenue
  const serviceMonthly = await ServiceBooking.aggregate([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$finalPrice" },
      },
    },
  ]);

  // Package monthly revenue
  const packageMonthly = await PackageOrder.aggregate([
    {
      $lookup: {
        from: "packages",
        localField: "package",
        foreignField: "_id",
        as: "packageDetails",
      },
    },
    { $unwind: "$packageDetails" },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$packageDetails.finalPrice" },
      },
    },
  ]);

  // Merge both into a map
  const revenueMap = new Map();

  serviceMonthly.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;
    revenueMap.set(key, (revenueMap.get(key) || 0) + item.total);
  });

  packageMonthly.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;
    revenueMap.set(key, (revenueMap.get(key) || 0) + item.total);
  });

  // Convert to array
  const monthlyRevenue = Array.from(revenueMap, ([key, total]) => {
    const [year, month] = key.split("-");
    return { year: parseInt(year), month: parseInt(month), total };
  }).sort((a, b) =>
    a.year === b.year ? a.month - b.month : a.year - b.year
  );

  return monthlyRevenue;
};

// Dashboard Controller
const dashboardController = {
  getStats: async (req, res) => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));

      // --- Total Revenue ---
      const serviceRevenue = await ServiceBooking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$finalPrice" } } },
      ]);

      const packageRevenue = await PackageOrder.aggregate([
        {
          $lookup: {
            from: "packages",
            localField: "package",
            foreignField: "_id",
            as: "packageDetails",
          },
        },
        { $unwind: "$packageDetails" },
        {
          $group: { _id: null, total: { $sum: "$packageDetails.finalPrice" } },
        },
      ]);

      const totalRevenue =
        (serviceRevenue[0]?.total || 0) + (packageRevenue[0]?.total || 0);

      // --- Monthly Revenues ---
      const monthlyRevenue = await getMonthlyRevenue();

      const now = new Date();
      const thisMonth = monthlyRevenue.find(
        (r) => r.year === now.getFullYear() && r.month === now.getMonth() + 1
      );

      const prevMonth =
        now.getMonth() > 0
          ? monthlyRevenue.find(
              (r) => r.year === now.getFullYear() && r.month === now.getMonth()
            )
          : monthlyRevenue.find(
              (r) => r.year === now.getFullYear() - 1 && r.month === 12
            );

      // --- Total Bookings ---
      const totalServiceBookings = await ServiceBooking.countDocuments();
      const totalPackageOrders = await PackageOrder.countDocuments();

        // --- Today’s Service Bookings (with details) ---
        const todayServiceBookings = await ServiceBooking.find({
          date: { $gte: startOfToday, $lte: endOfToday }, // check date field
        })
          .populate("service", "title")   // get service name
          .populate("user", "username")   // get username
          .select("date time service user"); // include only necessary fields

      return res.json({
        totalRevenue,
        thisMonthRevenue: thisMonth?.total || 0,
        previousMonthRevenue: prevMonth?.total || 0,
        monthlyRevenue, // full breakdown (useful for charts)
        totalServiceBookings,
        totalPackageOrders,
        todayServiceBookings,
      });
    } catch (err) {
      console.error("Dashboard Error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = dashboardController;
