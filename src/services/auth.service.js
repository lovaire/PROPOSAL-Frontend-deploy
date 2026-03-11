const TOKEN_KEY = 'user_token';

export const authService = {
    // Removed the ': string|null' type annotation
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    // You might also want to add these for a complete service:
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
    }
};