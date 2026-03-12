import axios from "axios";
import { authService } from "@/services/auth.service";

/**
 * Creates an Axios instance with a pre-configured
 * Authorization interceptor.
 */
export const createApi = (baseURL) => {
    const api = axios.create({
        baseURL,
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
        (error) => {
            return Promise.reject(error);
        }
    );

    return api;
};