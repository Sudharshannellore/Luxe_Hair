import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, TrendingUp, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Loader from "../components/Loader";

const API_URL = import.meta.env.VITE_API_URL;

const colorClasses = {
  purple: "from-purple-500 to-purple-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  pink: "from-pink-500 to-pink-600",
};

function RupeeIcon() {
  return <span className="text-2xl font-bold text-white">₹</span>;
}

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl`}
        >
          {Icon ? <Icon className="h-6 w-6 text-white" /> : <RupeeIcon />}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    totalServiceBookings: 0,
    totalPackageOrders: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    monthlyRevenue: [],
    todayServiceBookings: [],
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/dashboard/get`);
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const availableYears = [
    ...new Set(stats.monthlyRevenue.map((item) => item.year)),
  ];

  const chartData = stats.monthlyRevenue
    .filter((item) => item.year === selectedYear)
    .map((item) => ({
      month: new Date(item.year, item.month - 1).toLocaleString("default", {
        month: "short",
      }),
      revenue: item.total,
    }));

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : (
        <>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Welcome back! Here’s what’s happening today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Bookings"
              value={stats.totalServiceBookings}
              icon={Calendar}
              color="purple"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={null}
              color="green"
            />
            <StatCard
              title="This Month"
              value={formatCurrency(stats.thisMonthRevenue)}
              icon={null}
              color="blue"
            />
            <StatCard
              title="Package Orders"
              value={stats.totalPackageOrders}
              icon={TrendingUp}
              color="pink"
            />
          </div>

          {/* Charts and Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Monthly Revenue
                </h3>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today’s Schedule */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Today’s Schedule
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-64">
                {stats.todayServiceBookings.length > 0 ? (
                  stats.todayServiceBookings.map((booking, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 border-b border-gray-100 pb-3 last:border-b-0 hover:bg-gray-50 rounded-lg p-2 transition"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {booking.time} – {booking.service?.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.user?.username}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No bookings today</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
