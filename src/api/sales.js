import api from './axios';

// Sales
export const getAllSales = () => api.get('/sales');
export const getSalesDetail = (id) => api.get(`/sales/${id}`);
export const getPerfSales = (first, last) => api.get('/sales/perf', { params: { first, last } })
export const createSales = (data) => api.post('/sales/add', data);
export const updateSales = (id, data) => api.put(`/sales/${id}`, data);

// Invoice
export const createInvoice = (data) => api.post('/invoices', data);

// Products
export const getAllProducts = () => api.get('/sales/product?all=true');
export const getAllActiveProducts = () => api.get('/sales/product')
export const createProduct = (data) => api.post('/sales/product/add', data);
export const updateProduct = (data) => api.put('/sales/product/update', data);
export const updateProductStatus = (id) => api.put(`/sales/product/${id}`);
export const deleteProduct = (id) => api.delete(`/sales/product/${id}`);