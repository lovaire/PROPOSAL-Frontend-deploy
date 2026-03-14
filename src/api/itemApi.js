// src/api/itemApi.js
import { createApi } from "@/api/base";

const api = createApi();

export const getAllItems = () => api.get('/item/getAll');
export const addItem = (data) => api.post('/item/add', data);
export const updateItem = (data) => api.put('/item/update', data);
export const deleteItem = (id) => api.delete(`/item/delete/${id}`);