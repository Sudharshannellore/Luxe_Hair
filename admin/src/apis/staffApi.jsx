import api from "../lib/api";

/** Builds multipart form data from a plain object (skips undefined/null; File kept as-is). */
const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") fd.append(k, v);
  });
  return fd;
};

export const getAllStaff = async () => (await api.get("/staff/get")).data;
export const createStaff = async (data) => (await api.post("/staff/save", toFormData(data))).data;
export const updateStaff = async (id, data) => (await api.put(`/staff/update/${id}`, toFormData(data))).data;
export const deleteStaff = async (id) => (await api.delete(`/staff/delete/${id}`)).data;

/**
 * Active staff who can be assigned. Pass { date: "YYYY-MM-DD", timeSlot: "HH:mm" }
 * to exclude staff already booked in that slot.
 */
export const getActiveStaff = async (params = {}) => (await api.get("/staff/active-staff", { params })).data;
