import { createApi } from "@/api/base";

const api = createApi(import.meta.env.VITE_API_URL);

export const getAllSuppliers = () => {
  return api.get("/suppliers");
};

export const createSupplier = (data) => {
  return api.post("/suppliers", data);
};

export const updateSupplierApi = (id, data) => {
  return api.put(`/suppliers/${id}`, data);
};

export const deleteSupplierApi = (id) => {
  return api.delete(`/suppliers/${id}`);
};