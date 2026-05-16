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

export const getGrafik = (bulanIn, bulanOut, filter, filterValue) => api.get(`/distributions/summary`, {
  params: {
    bulanIn,
    bulanOut,
    filter,
    filterValue
  }
})

export const getDepartements = () => api.get(`/distributions/departments`)
