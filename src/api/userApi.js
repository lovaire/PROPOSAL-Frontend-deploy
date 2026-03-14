import { createApi } from "@/api/base";

const api = createApi(import.meta.env.VITE_API_URL);

export const getAllUsers = () => api.get('/users');
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);