// src/api/itemApi.js
import api from './axios';

export const getAllItems = () => api.get('/item/getAll');
export const addItem = (data) => api.post('/item/add', data);
export const updateItem = (data) => api.put('/item/update', data);
export const deleteItem = (id) => api.delete(`/item/delete/${id}`);