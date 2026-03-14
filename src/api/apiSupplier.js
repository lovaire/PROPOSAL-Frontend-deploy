// src/api/supplierApi.js
import { createApi } from "@/api/base";

const api = createApi();

export const getAllSuppliers = () => api.get("/suppliers");
export const createSupplier = (data) => api.post("/suppliers", data);
export const updateSupplierApi = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplierApi = (id) => api.delete(`/suppliers/${id}`);