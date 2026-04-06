// src/services/auth.service.js
const TOKEN_KEY = 'token';   // ← ubah dari 'user_token' jadi 'token'

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