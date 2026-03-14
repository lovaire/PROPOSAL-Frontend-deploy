import { createApi } from "@/api/base"; // Menggunakan base konfigurasi tim 

// Sesuaikan dengan RequestMapping di Controller Backend-mu
const api = createApi(`${import.meta.env.VITE_API_URL}/item`);

export const getAllItems = () => {
    return api.get('/getAll');
};

export const addItem = (data) => {
    return api.post('/add', data);
};

export const updateItem = (data) => {
    return api.put('/update', data);
};

export const deleteItem = (id) => {
    return api.delete(`/delete/${id}`);
};