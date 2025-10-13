/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  fetchOrdersApi,
  useServiceApi,
  updatePaymentStatus,
  assignStaffToService,
} from "../apis/orderApi";
import { getActiveStaff } from "../apis/staffApi";
import Loader from "../components/Loader";

const ComboOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // refresh orders and keep selected order updated
  const refreshOrders = async () => {
    try {
      const data = await fetchOrdersApi();
      setOrders(data || []);
      if (selectedOrder) {
        const updated = data.find((o) => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchOrdersApi();
        setOrders(data || []);
        const staffData = await getActiveStaff();
        setStaffList(staffData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatus = (order) => {
    const total = order.servicesUsed.length;
    const usedCount = order.servicesUsed.filter((s) => s.used).length;
    if (usedCount === 0) return "incomplete";
    if (usedCount === total) return "Complete";
    return "Pending";
  };

  const handleServiceToggle = async (orderId, serviceName) => {
    try {
      await useServiceApi(orderId, serviceName);
      await refreshOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.user.username.toLowerCase().includes(search.toLowerCase()) ||
      order.package.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter
      ? getStatus(order) === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  const statusColor = (status) => {
    if (status === "Complete") return "bg-green-100 text-green-700";
    if (status === "Pending") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-amber-700">
        Combos Orders
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <input
          type="text"
          placeholder="Search by user or combos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 w-full md:w-1/3 shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
        >
          <option value="">All Status</option>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
          <option value="Not Started">Not Started</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl shadow bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  {[
                    "Package",
                    "Username",
                    "Total",
                    "Order Date",
                    "Expiry Date",
                    "Payment",
                    "Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-700"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer  transition  ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    {/* Package */}
                    <td className="px-6 py-4 font-medium">
                      {order.package?.title}
                    </td>
                    {/* Username */}
                    <td className="px-6 py-4">
                      {order.user?.username}
                    </td>
                    {/* Price */}
                    <td className="px-6 py-4">
                       {order?.finalPrice.toLocaleString("en-IN")}
                    </td>
                    {/* Order Date */}
                    <td className="px-6 py-4">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    {/* Expiry Date */}
                    <td className="px-6 py-4">
                      {new Date(order.expiryDate).toLocaleDateString()}
                    </td>
                    {/* Payment */}
                    <td className="px-6 py-4">
                      <select
                        value={order.paymentStatus}
                        onChange={async (e) => {
                          try {
                            await updatePaymentStatus(order._id, e.target.value);
                            await refreshOrders();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(
                          getStatus(order)
                        )}`}
                      >
                        {getStatus(order)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto animate-fadeIn">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>

                <h2 className="text-2xl font-bold mb-3 text-amber-600">
                  {selectedOrder.package?.title}
                </h2>
                <p className="text-gray-700 mb-2">
                  User: {selectedOrder.user?.username}
                </p>                
                <p className="text-gray-700 mb-2">
                  Price: ₹ {selectedOrder.package?.price.toLocaleString("en-IN")}
                </p>
                {
                  selectedOrder?.couponCode && (
                  <p className="text-gray-700 mb-2">
                    Code: {selectedOrder?.couponCode}
                  </p>
                  )}
                {
                  selectedOrder?.discount && (
                  <p className="text-gray-700 mb-2">
                    Discount: % {selectedOrder?.discount}
                  </p>
                  )}
                {
                  selectedOrder?.finalPrice && (
                  <p className="text-gray-700 mb-2">
                    Total: ₹ {selectedOrder?.finalPrice}
                  </p>
                  )}                                    
                <p className="text-gray-700 mb-2">
                  Order: {new Date(selectedOrder.orderDate).toLocaleString()}
                </p>
                <p className="text-gray-700 mb-4">
                  Expiry: {new Date(selectedOrder.expiryDate).toLocaleString()}
                </p>
                <p className="text-gray-700 mb-4">
                  Payment Status: {selectedOrder.paymentStatus}
                </p>

                <h3 className="font-semibold mb-3 text-lg">Services</h3>
                <div className="space-y-3">
                  {selectedOrder.servicesUsed.map((service) => (
                    <div
                      key={service.serviceName}
                      className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-2">
                        {service.used ? (
                          <span className="line-through text-gray-500 font-medium">
                            {service.serviceName}
                          </span>
                        ) : (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="accent-pink-500 w-4 h-4"
                              onChange={() =>
                                handleServiceToggle(
                                  selectedOrder._id,
                                  service.serviceName
                                )
                              }
                            />
                            <span className="font-medium">{service.serviceName}</span>
                          </label>
                        )}
                      </div>

                      <select
                        value={service.assignedStaff?._id || ""}
                        onChange={async (e) => {
                          const staffId = e.target.value;
                          if (staffId) {
                            try {
                              await assignStaffToService(
                                selectedOrder._id,
                                service.serviceName,
                                staffId
                              );
                              await refreshOrders();
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm border border-gray-300 shadow-sm"
                      >
                        <option value="">
                          {service.assignedStaff
                            ? service.assignedStaff.name
                            : "Assign Staff"}
                        </option>
                        {staffList.map((staff) => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComboOrders;
