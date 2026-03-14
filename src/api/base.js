// src/api/base.js
import axios from "axios";
import { authService } from "@/services/auth.service";

const envApiUrl = import.meta.env.VITE_API_URL;

const baseURL = envApiUrl || "https://proposal-backend-anbb.onrender.com/api";

export const createApi = () => {
    const api = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
        },
    });

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