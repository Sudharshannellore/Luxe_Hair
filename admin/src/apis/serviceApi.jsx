import api from "../lib/api";

export const fetchServicesApi = async () => (await api.get("/service/get")).data;
export const createServiceApi = async (formData) => (await api.post("/service/save", formData)).data;
export const updateServiceApi = async (id, formData) => (await api.put(`/service/update/${id}`, formData)).data;
export const deleteServiceApi = async (id) => (await api.delete(`/service/delete/${id}`)).data;
