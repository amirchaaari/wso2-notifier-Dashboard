import axiosInstance from './axiosInstance';

const BASE = '/api/custom-rules';

export const customRulesApi = {
    getAllRules: async () => (await axiosInstance.get(BASE)).data,
    createRule: async (payload) => (await axiosInstance.post(BASE, payload)).data,
    updateRule: async (id, payload) => (await axiosInstance.put(`${BASE}/${id}`, payload)).data,
    deleteRule: async (id) => (await axiosInstance.delete(`${BASE}/${id}`)).data,
    toggleRule: async (id, enabled) => (await axiosInstance.patch(`${BASE}/${id}/toggle?enabled=${enabled}`)).data,
    validateQuery: async (payload) => (await axiosInstance.post(`${BASE}/validate`, payload)).data,
};
