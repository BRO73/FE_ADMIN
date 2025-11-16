import axios from "axios";
import { Code } from "lucide-react";

const api = axios.create({
  baseURL: "https://be-aynl.onrender.com/api",
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
