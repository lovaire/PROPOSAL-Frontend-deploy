import { createApi } from "@/api/base";

// Cek nilai environment variable
const envApiUrl = import.meta.env.VITE_API_URL;
console.log('VITE_API_URL from env:', envApiUrl);

// Tentukan baseURL: prioritaskan env, lalu fallback sesuai environment (development/production)
const baseURL = envApiUrl || (process.env.NODE_ENV === 'production' 
    ? 'https://proposal-backend-anbb.onrender.com/api'   // URL production (Render)
    : 'http://localhost:8080/api');                       // URL development (lokal)

console.log('Using baseURL:', baseURL);

const api = createApi(baseURL);

class ProfileApi {
    async signup(userData) {
        return await api.post('/register', userData);
    }
    async signin(userData) {
        return await api.post('/login', userData);
    }
}

export default new ProfileApi();