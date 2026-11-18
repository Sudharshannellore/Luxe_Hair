import api from "../lib/api";

export const getAppointments = async () => (await api.get("/booking/all")).data;

export const updateAppointmentStatus = async (id, status) => (await api.patch(`/booking/status/${id}`, { status })).data;

export const updatePaymentStatus = async (id, paymentStatus) =>
  (await api.patch(`/booking/payment/${id}`, { paymentStatus })).data;

export const assignStaffToBooking = async (bookingId, staffId) =>
  (await api.post("/booking/assign-staff", { bookingId, staffId })).data;

/** Active staff, excluding anyone already booked at that date + slot when given. */
export const getAvailableStaff = async (date, timeSlot) =>
  (await api.get("/staff/active-staff", { params: date && timeSlot ? { date, timeSlot } : {} })).data;
