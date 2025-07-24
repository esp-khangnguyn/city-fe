// libs/axios.ts
import axios from "axios";
const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL,
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: handle lỗi tập trungS
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("❌ Axios error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default axiosInstance;
