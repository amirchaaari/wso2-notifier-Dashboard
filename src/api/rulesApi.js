import axios from 'axios';

// Ensure this matches your backend Vite CORS port and application running port
const API_BASE_URL = 'http://localhost:8082/api/rules';

export const rulesApi = {
    getAllRules: async () => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },

    getRuleByType: async (type) => {
        const response = await axios.get(`${API_BASE_URL}/${type}`);
        return response.data;
    },

    updateRule: async (type, requestPayload) => {
        const response = await axios.put(`${API_BASE_URL}/${type}`, requestPayload);
        return response.data;
    },

    enableRule: async (type) => {
        const response = await axios.patch(`${API_BASE_URL}/${type}/enable`);
        return response.data;
    },

    disableRule: async (type) => {
        const response = await axios.patch(`${API_BASE_URL}/${type}/disable`);
        return response.data;
    }
};
