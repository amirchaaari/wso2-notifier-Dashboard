import axiosInstance from './axiosInstance';

const BASE = '/api/rules';

export const rulesApi = {
    getAllRules:     async ()           => (await axiosInstance.get(BASE)).data,
    getRuleByType:  async (type)        => (await axiosInstance.get(`${BASE}/${type}`)).data,
    updateRule:     async (type, data)  => (await axiosInstance.put(`${BASE}/${type}`, data)).data,
    enableRule:     async (type)        => (await axiosInstance.patch(`${BASE}/${type}/enable`)).data,
    disableRule:    async (type)        => (await axiosInstance.patch(`${BASE}/${type}/disable`)).data,

    exportRules: async () => {
        const resp = await axiosInstance.get(`${BASE}/export`);
        return resp.data;
    },
    importRules: async (rules) =>
        (await axiosInstance.post(`${BASE}/import`, rules)).data,
};
