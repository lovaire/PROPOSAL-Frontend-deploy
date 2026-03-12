// import axios from "axios";

// const apiClient = axios.create({
//   baseURL: "http://localhost:8080/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export const getAllUsers = async () => {
//   return await apiClient.get("/users");
// };

// export const updateUser = async (id, payload) => {
//   return await apiClient.put(`/users/${id}`, payload);
// };

// export const deleteUser = async (id) => {
//   return await apiClient.delete(`/users/${id}`);
// };
// userApi.js
import { createApi } from "@/api/base";
const api = createApi(import.meta.env.VITE_API_URL || 'http://localhost:8080');

export const getAllUsers = () => {
    return api.get('/users');
};

export const updateUser = (id, data) => {
    return api.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
    return api.delete(`/users/${id}`);
};