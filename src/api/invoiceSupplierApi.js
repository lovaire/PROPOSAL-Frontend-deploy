import api from './axios';

export const getAllInvoices = () => api.get("/invoiceSupplier/list");
export const createInvoice = (data) => api.post("/invoiceSupplier/add", data);
export const updateInvoiceApi = (id, data) => api.put(`/invoiceSupplier/edit/${id}`, data);
export const deleteInvoiceApi = (id) => api.delete(`/invoiceSupplier/delete/${id}`);