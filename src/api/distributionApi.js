import api from './axios'

export const getDistributions = (search = '') => {
  const keyword = String(search || '').trim()
  if (!keyword) return api.get('/distributions')

  return api.get('/distributions', {
    params: {
      itemName: keyword,
      department: keyword
    }
  })
}

export const createDistribution = (payload) => api.post('/distributions', payload)

export const updateDistribution = (id, payload) => api.put(`/distributions/${id}`, payload)

export const deleteDistribution = (id) => api.delete(`/distributions/${id}`)

// Export laporan pemakaian barang - PDF
// category: string opsional, kosong string jika tidak difilter
export const exportDistributionPdf = (category = '') => {
  return api.get('/distributions/export/pdf', {
    params: { category },
    responseType: 'blob'
  })
}

// Export laporan pemakaian barang - CSV
export const exportDistributionCsv = (category = '') => {
  return api.get('/distributions/export/csv', {
    params: { category },
    responseType: 'blob'
  })
}
