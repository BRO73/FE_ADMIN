import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8082/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Thêm interceptor để tự động attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken"); // token lưu khi login
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
