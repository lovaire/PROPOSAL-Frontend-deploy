import api from './axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sales
export const getAllSales = () => api.get('/sales');
export const getSalesDetail = (id) => api.get(`/sales/${id}`);
export const createSales = (data) => api.post('/sales/add', data);
export const updateSales = (id, data) => api.put(`/sales/${id}`, data);

// Invoice
export const createInvoice = (data) => api.post('/invoices', data);

// Products
export const getAllProducts = () => api.get('/sales/product?all=true');
export const createProduct = (data) => api.post('/sales/product/add', data);
export const updateProduct = (data) => api.put('/sales/product/update', data);
export const updateProductStatus = (id) => api.put(`/sales/product/${id}`);
export const deleteProduct = (id) => api.delete(`/sales/product/${id}`);