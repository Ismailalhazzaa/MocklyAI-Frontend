import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://mocklyai-backend-eeetgjbsdedyfaex.swedencentral-01.azurewebsites.net/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request interceptor: attach token from localStorage ───
axiosInstance.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed?.token) {
        config.headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    } catch {
      // ignore malformed JSON
    }
  }
  return config;
});

// ─── Response interceptor: handle errors globally ───
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const message = data?.message || data?.error;
    if (message === 'token is required') {
      const newMessage = 'يجب تسجيل الدخول أولا لتتمكن من استخدام المنصة';
      if (data?.message) data.message = newMessage;
      if (data?.error) data.error = newMessage;
    }
    const isLogoutCall = error?.config?.url?.includes('/users/logout');
    // ─── Handle Unauthorized (401) ───
    if (error?.response?.status === 401 && !isLogoutCall) {
      // منع التوست المكرر
      error.isAuthError = true;
      localStorage.removeItem('user');
      sessionStorage.removeItem('mockly_session');
      setTimeout(() => {
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login';
        }
      }, 3000);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;