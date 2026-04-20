import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/api/incidents';

export const incidentsApi = {
    getAllIncidents: async (ruleType = '') => {
        const url = ruleType ? `${API_BASE_URL}?rule=${ruleType}` : API_BASE_URL;
        const response = await axios.get(url);
        return response.data;
    },
    
    acknowledgeIncident: async (id) => {
        const response = await axios.patch(`${API_BASE_URL}/${id}/acknowledge`);
        return response.data;
    },

    resolveIncident: async (id) => {
        const response = await axios.patch(`${API_BASE_URL}/${id}/resolve`);
        return response.data;
    }
};
