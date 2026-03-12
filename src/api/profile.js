// @/api/profile.js
import { createApi } from "@/api/base";

const envApiUrl = import.meta.env.VITE_API_URL;
console.log('VITE_API_URL from env:', envApiUrl);

const baseURL = envApiUrl || (process.env.NODE_ENV === 'production' 
    ? 'https://proposal-backend-anbb.onrender.com/api'   // Hapus spasi di akhir!
    : 'http://localhost:8080/api');

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

// ✅ Ganti 'user_token' jadi 'token' agar konsisten dengan store
const TOKEN_KEY = 'token';

export const authService = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
    }
};