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

export const getIncomeSummary = (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get('/fnb/income/summary', { params });
};

// Export laporan pendapatan FnB - PDF
// startDate dan endDate: string format 'yyyy-MM-dd' atau null/undefined
export const exportSalesPdf = (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get('/sales/export/pdf', {
    params,
    responseType: 'blob'
  });
};

// Export laporan pendapatan FnB - CSV
export const exportSalesCsv = (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get('/sales/export/csv', {
    params,
    responseType: 'blob'
  });
};

// src/api/sales.js
export const getMenuPerformance = (startDate, endDate, productIds = []) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (productIds.length) params.productIds = productIds.join(',');
  return api.get('/menu/performance', { params });
};