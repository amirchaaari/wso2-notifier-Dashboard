import axiosInstance from './axiosInstance';

export const authApi = {
  login: (username, password) =>
    axiosInstance.post('/api/auth/login', { username, password }).then(r => r.data),

  register: (username, email, password) =>
    axiosInstance.post('/api/auth/register', { username, email, password }).then(r => r.data),

  me: () =>
    axiosInstance.get('/api/auth/me').then(r => r.data),
};

export const adminApi = {
  getUsers: () =>
    axiosInstance.get('/api/admin/users').then(r => r.data),

  approveUser: (id) =>
    axiosInstance.patch(`/api/admin/users/${id}/approve`).then(r => r.data),

  disableUser: (id) =>
    axiosInstance.patch(`/api/admin/users/${id}/disable`).then(r => r.data),

  deleteUser: (id) =>
    axiosInstance.delete(`/api/admin/users/${id}`).then(r => r.data),

  resetPassword: (id, password) =>
    axiosInstance.patch(`/api/admin/users/${id}/reset-password`, { password }).then(r => r.data),
};
