import axios from 'axios';
import { createApi } from "@/api/base";

const api = createApi('http://localhost:8080/api/suppliers');
const API_URL = 'http://localhost:8080/api/suppliers';

export const getAllSuppliers = () => {
  return api.get(API_URL);
};

export const createSupplier = (data) => axios.post(API_URL, data);

export const updateSupplierApi = (id, data) => {
  return api.put(`${API_URL}/${id}`, data);
};

export const deleteSupplierApi = (id) => {
  return api.delete(`${API_URL}/${id}`);
};