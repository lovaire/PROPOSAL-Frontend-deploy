import { createApi } from "@/api/base";

// const API_URL = import.meta.env.VITE_API_URL;
const api = createApi("http://localhost:8082/api");

class ProfileApi {
    /**
     * Sends user data to the registration endpoint
     * @param {Object} userData
     */
    async signup(userData) {
        return await api.post('/register', userData);
    }

    async signin(userData) {
        return await api.post('/login', userData);
    }
}

export default new ProfileApi();