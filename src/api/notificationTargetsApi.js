import axiosInstance from './axiosInstance';

const BASE = '/api/notification-targets';

export const notificationTargetsApi = {
    getAllTargets: async () => (await axiosInstance.get(BASE)).data,
    createTarget: async (target) => (await axiosInstance.post(BASE, target)).data,
    updateTarget: async (id, target) => (await axiosInstance.put(`${BASE}/${id}`, target)).data,
    deleteTarget: async (id) => (await axiosInstance.delete(`${BASE}/${id}`)).data,
    toggleTarget: async (id) => (await axiosInstance.patch(`${BASE}/${id}/toggle`)).data,
};
