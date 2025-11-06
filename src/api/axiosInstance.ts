import axios from "axios";
import { Code } from "lucide-react";

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

export function getApiOrigin(): string {
    const raw = (api.defaults.baseURL ?? "").trim();
    if (!raw) return "http://localhost:8082"; // fallback an toàn
    const noTrail = raw.replace(/\/+$/, "");
    return noTrail.endsWith("/api") ? noTrail.slice(0, -4) : noTrail;
}

    export default api;
