import api from './axios'

function buildParams(params = {}) {
  const out = {}
  if (params.search) out.search = params.search
  if (params.startDate) out.startDate = params.startDate
  if (params.endDate) out.endDate = params.endDate
  return out
}

export function getAllTransactions(params) {
  return api.get('/transaction/getAll', { params: buildParams(params) })
}

export function createTransaction(payload) {
  return api.post('/transaction/add', payload)
}

export function updateTransaction(payload) {
  return api.put('/transaction/update', payload)
}

export function deleteTransaction(id) {
  return api.delete(`/transaction/delete/${id}`)
}

