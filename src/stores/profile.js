// @/stores/profile.js
import { ref } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import profileApi from '@/api/profile.js';

// ✅ Pastikan path ini sesuai: apakah authService export dari @/api/profile.js?
// Kalau iya, import dari sana:
import { authService } from "@/api/profile.js"; 
// Kalau lo memang punya file terpisah @/services/auth.service.js, biarkan seperti aslinya.

import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', () => {
    // ✅ Gunakan key 'token' yang sudah disamakan
    const token = ref(localStorage.getItem('token') || '');
    const user = ref(null);
    const router = useRouter();

    const cleanRole = (role) => {
        if (!role) return '';
        let cleaned = role.toLowerCase();
        if (cleaned.startsWith('role_')) {
            cleaned = cleaned.substring(5);
        }
        return cleaned;
    };

    const logout = () => {
        authService.removeToken();
        token.value = '';
        user.value = null;
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        router.push('/login');
    };

    const initUserFromToken = () => {
        if (token.value) {
            try {
                const decoded = jwtDecode(token.value);
                const rawRole = decoded.role || '';
                const role = cleanRole(rawRole);
                user.value = {
                    id: decoded.userId || decoded.sub,
                    role: role,
                    username: decoded.username || decoded.sub,
                    email: decoded.email || ''
                };
                localStorage.setItem('userId', user.value.id);
                localStorage.setItem('role', user.value.role);
            } catch (e) {
                console.error('Token tidak valid', e);
                logout();
            }
        }
    };
    initUserFromToken();

    const register = async (payload) => {
        try {
            await profileApi.signup(payload);
        } catch (error) {
            const status = error.response?.status;
            if (status === 400) {
                throw new Error('Format Email tidak Valid!');
            } else {
                throw new Error('Register Tidak Berhasil');
            }
        }
    };

    const login = async (payload) => {
        try {
            const response = await profileApi.signin(payload);
            // ✅ Lo udah benar pakai optional chaining untuk nested data
            const newToken = response.data.data?.token;
            if (!newToken) throw new Error('Token tidak ditemukan');

            authService.setToken(newToken);
            token.value = newToken;

            const decoded = jwtDecode(newToken);
            const rawRole = decoded.role || '';
            const role = cleanRole(rawRole);
            
            user.value = {
                id: decoded.userId || decoded.sub,
                role: role,
                username: decoded.username || decoded.sub,
                email: decoded.email || ''
            };
            localStorage.setItem('userId', user.value.id);
            localStorage.setItem('role', user.value.role);
            
            // ✅ RETURN role agar bisa dipakai di Login.vue
            return role;
            
        } catch (error) {
            const status = error.response?.status;
            if (status === 400) {
                throw new Error('Format Email tidak Valid!');
            } else if (status === 401) {
                throw new Error('Email atau password Salah.');
            } else {
                throw new Error('Login Tidak Berhasil');
            }
        }
    };

    return {
        token,
        user,
        register,
        login,
        logout
    };
});