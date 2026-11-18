import api from "../lib/api";

export const fetchPackagesApi = async () => (await api.get("/package/get")).data;
export const createPackageApi = async (formData) => (await api.post("/package/save", formData)).data;
export const updatePackageApi = async (id, formData) => (await api.put(`/package/update/${id}`, formData)).data;
export const deletePackageApi = async (id) => (await api.delete(`/package/delete/${id}`)).data;
