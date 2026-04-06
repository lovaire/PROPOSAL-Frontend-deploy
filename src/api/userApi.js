// src/api/userApi.js
import api from './axios';  // ← import instance yang sudah dikonfigurasi

export const getAllUsers = () => api.get('/users');
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);