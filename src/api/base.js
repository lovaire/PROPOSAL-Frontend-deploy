// src/api/base.js
import axios from "axios";
import { authService } from "@/services/auth.service";

/**
 * Creates an Axios instance with a pre-configured
 * Authorization interceptor.
 */
export const createApi = (baseURL = import.meta.env.VITE_API_URL) => {
    const api = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Request interceptor to automatically add the Bearer token
    api.interceptors.request.use(
        (config) => {
            const token = authService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    return api;
};