import axiosInstance from './axiosInstance';

export const aiApi = {
    generateQuery: async (userRequest, targetIndex) =>
        (await axiosInstance.post('/api/ai/generate-query', { userRequest, targetIndex })).data,
};
