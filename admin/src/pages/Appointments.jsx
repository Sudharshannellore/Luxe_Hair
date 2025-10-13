import React, { useState, useEffect } from "react";
import { Clock, User, Search } from "lucide-react";
import {
  getAppointments,
  updateAppointmentStatus,
  updatePaymentStatus,
  assignStaffToBooking,
} from "../apis/appointmentApi";
import { getActiveStaff } from "../apis/staffApi";
import Loader from "../components/Loader";

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openAppointmentModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeAppointmentModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  };

  // Helper to show date tile
  const formatDateTile = (isoString) => {
    if (!isoString) return { day: "", month: "" };
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  // Fetch appointments and staff
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data || []);
      const staffData = await getActiveStaff();
      setStaffList(staffData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;
    const matchesSearch =
      (appointment.user?.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (appointment.service?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesDate =
      !selectedDate || selectedDate === appointment.date?.split("T")[0];
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Helper to refresh appointments after any update
  const refreshAppointments = async () => {
    await fetchData();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-700">Appointments</h1>
          <p className="mt-2 text-gray-600">Manage and track all appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Date */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <p className="text-gray-600 text-center">No appointments found</p>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const { day, month } = formatDateTile(appointment.updatedAt);
              return (
                <div
                  key={appointment._id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-200 transition-colors shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    {/* Info */}
                    <div className="flex items-center space-x-4">
                      {/* Date Tile */}
                      <div
                        onClick={() => openAppointmentModal(appointment)}
                        className="w-14 h-14 bg-amber-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transform transition"
                      >
                        <span className="text-lg font-bold text-amber-700">{day}</span>
                        <span className="text-xs font-medium text-amber-600">{month}</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.service?.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time} ({appointment.service?.duration})
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {appointment.user?.email}
                          </span>
                          <span className="font-semibold">
                            ₹ {appointment.service?.finalPrice ?? appointment.finalPrice ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-0">
                      {/* Status Dropdown */}
                      <select
                        value={appointment.status}
                        onChange={async (e) => {
                          try {
                            await updateAppointmentStatus(appointment._id, e.target.value);
                            await refreshAppointments();
                          } catch (err) {
                            console.error("Error updating status:", err);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                      </select>

                      {/* Payment Status Dropdown */}
                      <select
                        value={appointment.paymentStatus}
                        onChange={async (e) => {
                          try {
                            await updatePaymentStatus(appointment._id, e.target.value);
                            await refreshAppointments();
                          } catch (err) {
                            console.error("Error updating payment status:", err);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>

                      {/* Staff Assign Dropdown */}
                      <select
                        value={appointment.assignedStaff?._id || ""}
                        onChange={async (e) => {
                          try {
                            const selectedStaffId = e.target.value;
                            if (selectedStaffId) {
                              await assignStaffToBooking(appointment._id, selectedStaffId);
                              await refreshAppointments();
                            }
                          } catch (err) {
                            console.error("Error assigning staff:", err);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 cursor-pointer"
                      >
                        <option value="">
                          {appointment.assignedStaff
                            ? `Assigned: ${appointment.assignedStaff.name}`
                            : "Assign Staff"}
                        </option>
                        {staffList.map((staff) => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Modal */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[80vh] p-6 relative overflow-y-auto animate-fadeIn">
            <button
              onClick={closeAppointmentModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4 text-amber-600">
              Appointment Details
            </h2>

            {/* User Info */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-1">User</h3>
              <p className="text-gray-800">Name: {selectedAppointment.user?.username}</p>
              <p className="text-gray-800">Email: {selectedAppointment.user?.email}</p>
              <p className="text-gray-800">Price: ₹{selectedAppointment.price}</p>
              {selectedAppointment.couponCode && (
              <p className="text-gray-800">Code: {selectedAppointment.couponCode}</p>
                )}
              {selectedAppointment.discount && (
              <p className="text-gray-800">Discount: %{selectedAppointment.discount}</p>
                )}
              {selectedAppointment.finalPrice && (
              <p className="text-gray-800">Total: ₹{selectedAppointment.finalPrice}</p>
                )}                                
            </div>

            {/* Service Info */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-1">Service</h3>
              <p className="text-gray-800">Title: {selectedAppointment.service?.title}</p>
              <p className="text-gray-800">Category: {selectedAppointment.service?.category}</p>
              <p className="text-gray-800">Duration: {selectedAppointment.service?.duration}</p>
              <p className="text-gray-800">Description: {selectedAppointment.service?.description}</p>
              <p className="text-gray-800">
                Benefits: {selectedAppointment.service?.benefits?.join(", ")}
              </p>
            </div>

            {/* Assigned Staff */}
            {selectedAppointment.assignedStaff && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-1">Assigned Staff</h3>
                <p className="text-gray-800">Name: {selectedAppointment.assignedStaff.name}</p>
                <p className="text-gray-800">Email: {selectedAppointment.assignedStaff.email}</p>
              </div>
            )}

            {/* Reviews */}
            {selectedAppointment.reviews?.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <h3 className="font-semibold text-gray-700 mb-2">Reviews</h3>
                {selectedAppointment.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="border-t border-gray-200 pt-2 mb-2 text-gray-800"
                  >
                    <p className="italic">"{review.comment}"</p>
                    <p>Rating: {review.rating} / 5</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
