import axiosInstance from './axiosInstance';

const BASE = '/api/notifications';

export const notificationsApi = {
    getUnreadNotifications: async () => {
        return (await axiosInstance.get(BASE)).data;
    },
    markAsRead: async (id) => {
        return (await axiosInstance.put(`${BASE}/${id}/read`)).data;
    },
    markAllAsRead: async () => {
        return (await axiosInstance.put(`${BASE}/read-all`)).data;
    }
};
