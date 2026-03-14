// src/api/axios.js
import axios from 'axios'
import { authService } from '@/services/auth.service'

const api = axios.create({
  // ✅ Pakai import.meta.env untuk Vite + prefix VITE_
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    // ✅ Daftar endpoint publik yang tidak butuh token
    const publicEndpoints = [
      '/login',
      '/auth/login', 
      '/register',
      '/refresh-token',
      '/public'
    ]

    // ✅ Cek apakah URL request termasuk endpoint publik
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    )

    // ✅ Hanya attach token jika BUKAN endpoint publik
    if (!isPublicEndpoint) {
      const token = authService.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default api