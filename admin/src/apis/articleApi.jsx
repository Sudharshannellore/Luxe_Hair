import api from "../lib/api";

export const fetchArticlesApi = async () => (await api.get("/article/get")).data;
export const createArticleApi = async (formData) => (await api.post("/article/save", formData)).data;
export const updateArticleApi = async (id, formData) => (await api.put(`/article/update/${id}`, formData)).data;
export const deleteArticleApi = async (id) => (await api.delete(`/article/delete/${id}`)).data;
