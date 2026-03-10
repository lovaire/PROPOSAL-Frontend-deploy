import axios from 'axios';

const API_URL = 'http://localhost:8080/api/suppliers';

export const getAllSuppliers = () => {
  return axios.get(API_URL);
};

export const createSupplier = (data) => axios.post(API_URL, data);

export const updateSupplierApi = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data);
};

export const deleteSupplierApi = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};