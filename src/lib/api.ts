import axios from 'axios';

// 🟢 ADD THIS LINE (Force the Railway URL):
const API_URL = 'https://performance-pulse-46-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If 401, clear token and redirect to login (optional, handled by AuthContext usually)
      localStorage.removeItem('token');
      // You might want to trigger a logout action here if you have access to the store/context
    }
    return Promise.reject(error);
  }
);

export default api;
