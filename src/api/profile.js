// src/api/profile.js
import api from './axios'; // pakai instance axios yang sudah dikonfigurasi (baseURL + interceptor token)

class ProfileApi {
    async signup(userData) {
        return await api.post('/register', userData);
    }
    async signin(userData) {
        return await api.post('/login', userData);
    }
}

export default new ProfileApi();