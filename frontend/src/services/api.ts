import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' || 'https://api.khoiva.id.vn/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
const hostname = window.location.hostname;

const baseURL = import.meta.env.VITE_API_URL || (() => {
  if (hostname === 'khoiva.id.vn') {
    return 'https://api.khoiva.id.vn/api';
  }
    return `http://${hostname}:3000/api`;
})();

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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