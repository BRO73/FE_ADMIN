import axios from "axios";

// 🧠 Lấy base URL từ .env (có thể là IP LAN, ngrok, domain...)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Thêm interceptor để tự động attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
