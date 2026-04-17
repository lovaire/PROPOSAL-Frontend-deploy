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
