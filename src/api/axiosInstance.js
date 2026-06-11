import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8082',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (token expired) but NOT if already on login/register page
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    if (error.response?.status === 401 && !isAuthPage) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
