import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// Kiểu response chung từ Spring Boot (thường trả JSON)
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
  timestamp?: string;
}

// Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://be-aynl.onrender.com/api", // Backend URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: gắn token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: unwrap data + handle lỗi
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Spring Boot thường trả object, ví dụ { data, message, status }
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        console.warn("Unauthorized → redirect login");
        // Ví dụ: clear token và chuyển sang login
        localStorage.removeItem("accessToken");
        // window.location.href = "/login";
      }

      if (status === 403) {
        console.error("Forbidden: No permission");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
