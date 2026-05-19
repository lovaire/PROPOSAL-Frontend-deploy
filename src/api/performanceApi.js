import api from './axios';

function buildParams(params = {}) {
    const out = {};
    if (params.startDate) out.startDate = params.startDate;
    if (params.endDate) out.endDate = params.endDate;
    return out;
}

// Memanggil endpoint untuk data grafik performa
export const getFinancialPerformance = (params) => api.get('/financial-performance/summary', { params: buildParams(params) });