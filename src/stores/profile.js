import { ref } from "vue";
import { defineStore } from "pinia"; // Added this
import { useRouter } from "vue-router"; // Added this
import profileApi from '@/api/profile.js';
import {authService} from "@/services/auth.service";

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const user = ref(null);
    const router = useRouter();

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
            const token = response.data.data?.token
            authService.setToken(token)
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login Failed');
        }
    }

    // CRITICAL: In JS/Setup stores, you MUST return what you want to use elsewhere
    return {
        token,
        user,
        router,
        register,
        login
    };
});