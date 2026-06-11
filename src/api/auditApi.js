import axiosInstance from './axiosInstance';

const BASE = '/api/audit';

export const auditApi = {
    getAllRuleLogs: async ({ page = 0, size = 20 } = {}) =>
        (await axiosInstance.get(`${BASE}/rules`, { params: { page, size } })).data,

    getRuleLogs: async (ruleId, { page = 0, size = 20 } = {}) =>
        (await axiosInstance.get(`${BASE}/rules/${ruleId}`, { params: { page, size } })).data,
};
