import axios from 'axios';
import { toast } from 'sonner';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        // If 401, clear token and redirect to login (optional, handled by AuthContext usually)
        localStorage.removeItem('token');
        // You might want to trigger a logout action here if you have access to the store/context
        toast.error('Session expired. Please login again.');
      } else if (error.response.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (error.response.status === 404) {
        // Don't show toast for 404s as they might be handled by the component
      } else if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        // Show error message from backend if available
        const message = error.response.data?.message || 'An error occurred';
        toast.error(message);
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

export default api;
