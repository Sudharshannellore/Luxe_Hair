import api from "../lib/api";

export const fetchOrdersApi = async () => (await api.get("/order/get-all")).data || [];

export const markServiceUsedApi = async (orderId, serviceName) =>
  (await api.patch("/order/use-service", { orderId, serviceName })).data;

export const updatePaymentStatus = async (orderId, paymentStatus) =>
  (await api.patch(`/order/update-payment/${orderId}`, { paymentStatus })).data;

export const assignStaffToService = async (orderId, serviceName, staffId) =>
  (await api.post("/order/assign-staff", { orderId, serviceName, staffId })).data;
