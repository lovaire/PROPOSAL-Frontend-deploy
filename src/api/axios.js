import axios from 'axios'
import { authService } from '@/services/auth.service'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api