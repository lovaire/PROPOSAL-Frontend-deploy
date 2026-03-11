import { createApi } from "@/api/base";

const api = createApi("http://localhost:8080/api"); // ubah dari 8082 ke 8080

class ProfileApi {
    async signup(userData) {
        return await api.post('/register', userData);
    }
    async signin(userData) {
        return await api.post('/login', userData);
    }
}

export default new ProfileApi();