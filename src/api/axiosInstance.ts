import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed?.token) {
        config.headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

export default axiosInstance;