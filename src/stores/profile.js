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

    // 1. Definisikan logout duluan
    const logout = () => {
        authService.removeToken();
        token.value = '';
        user.value = null;
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        router.push('/login');
    };

    // 2. Inisialisasi user dari token jika ada
    const initUserFromToken = () => {
        if (token.value) {
            try {
                const decoded = jwtDecode(token.value);
                // Sesuaikan dengan claims dari backend
                user.value = {
                    id: decoded.userId || decoded.sub,
                    role: (decoded.role || '').toLowerCase(),
                    username: decoded.username || decoded.sub,
                    email: decoded.email || ''
                };
                // Simpan juga di localStorage untuk komponen lain
                localStorage.setItem('userId', user.value.id);
                localStorage.setItem('role', user.value.role);
            } catch (e) {
                console.error('Token tidak valid', e);
                logout(); // sekarang logout sudah ada
            }
        }
    };
    initUserFromToken();

    const register = async (payload) => {
        try {
            await profileApi.signup(payload);
        } catch (error) {
            const status = error.response.status;

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
            const newToken = response.data.data?.token;
            if (!newToken) throw new Error('Token tidak ditemukan');

            authService.setToken(newToken);
            token.value = newToken;

            const decoded = jwtDecode(newToken);
            user.value = {
                id: decoded.userId || decoded.sub,
                role: (decoded.role || '').toLowerCase(),
                username: decoded.username || decoded.sub,
                email: decoded.email || ''
            };
            localStorage.setItem('userId', user.value.id);
            localStorage.setItem('role', user.value.role);
        } catch (error) {
            const status = error.response.status;

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