import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' || 'https://api.khoiva.id.vn/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
const hostname = window.location.hostname;

// 2. Logic tự động chọn API URL
const baseURL = import.meta.env.VITE_API_URL || (() => {
  // Nếu đang chạy trên domain thật (Tunnel/Production)
  if (hostname === 'khoiva.id.vn') {
    return 'https://api.khoiva.id.vn/api';
  }
  
  // Nếu đang chạy Localhost hoặc LAN (VD: 192.168.1.5)
  // Nó sẽ tự ghép thành http://192.168.1.5:3000/api
  return `http://${hostname}:3000/api`;
})();

// 3. Tạo axios instance với URL động vừa tính được
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;