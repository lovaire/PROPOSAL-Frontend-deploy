// src/api/transactionApi.js
import api from './axios';


function buildParams(params = {}) {
    const out = {};
    if (params.search) out.search = params.search;
    if (params.startDate) out.startDate = params.startDate;
    if (params.endDate) out.endDate = params.endDate;
    return out;
}

export const getAllTransactions = (params) => api.get('/transaction/getAll', { params: buildParams(params) });
export const createTransaction = (payload) => api.post('/transaction/add', payload);
export const updateTransaction = (payload) => api.put('/transaction/update', payload);
export const deleteTransaction = (id) => api.delete(`/transaction/delete/${id}`);
export const getTaxRecap = (params) => api.get('/transaction/tax-recap', { params: buildParams(params) });