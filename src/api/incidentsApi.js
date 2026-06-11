import axiosInstance from './axiosInstance';

const BASE = '/api/incidents';

export const incidentsApi = {
    getAllIncidents: async ({ rule = '', status = '', page = 0, size = 10 } = {}) => {
        const params = new URLSearchParams();
        if (rule)   params.append('rule', rule);
        if (status) params.append('status', status);
        params.append('page', page);
        params.append('size', size);
        return (await axiosInstance.get(`${BASE}?${params.toString()}`)).data;
    },
    getIncidentCounts: async () =>
        (await axiosInstance.get(`${BASE}/counts`)).data,
    getOpenIncidentsCount: async () =>
        (await axiosInstance.get(`${BASE}/count/open`)).data,
    acknowledgeIncident: async (id, user) =>
        (await axiosInstance.patch(`${BASE}/${id}/acknowledge`, null, { params: { user } })).data,
    resolveIncident: async (id) =>
        (await axiosInstance.patch(`${BASE}/${id}/resolve`)).data,
    deleteIncident: async (id) =>
        axiosInstance.delete(`${BASE}/${id}`),

    // AI Diagnosis
    diagnoseIncident: async (id) =>
        (await axiosInstance.get(`${BASE}/${id}/diagnose`)).data,

    // Assignment
    assignIncident: async (id, user) =>
        (await axiosInstance.patch(`${BASE}/${id}/assign`, null, { params: { user } })).data,

    // Comments
    getComments: async (id) =>
        (await axiosInstance.get(`${BASE}/${id}/comments`)).data,
    addComment: async (id, content, author) =>
        (await axiosInstance.post(`${BASE}/${id}/comments`, null, { params: { content, author } })).data,
    deleteComment: async (id, commentId) =>
        axiosInstance.delete(`${BASE}/${id}/comments/${commentId}`),
};
