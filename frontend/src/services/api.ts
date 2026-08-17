import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pillsync-backend-4191.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into header if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pillsync_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
