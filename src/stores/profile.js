import { ref } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import profileApi from '@/api/profile.js';
import { authService } from "@/services/auth.service";
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const user = ref(null);
    const router = useRouter();

    // Fungsi untuk membersihkan role dari prefix "ROLE_"
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
            throw new Error(error.response?.data?.message || 'Registration Failed');
        }
    };

    const login = async (payload) => {
        try {
            const response = await profileApi.signin(payload);
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
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login Failed');
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