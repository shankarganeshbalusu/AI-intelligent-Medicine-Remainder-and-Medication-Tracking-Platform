const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http') && !envUrl.includes('_pp')) {
    return envUrl;
  }
  return 'https://pillsync-backend-api.vercel.app/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
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
