import axiosInstance from './axiosInstance';

/**
 * @param {object} opts
 * @param {string} [opts.preset] Rolling window preset (ignored if from+to set)
 * @param {string} [opts.from] ISO-8601 start
 * @param {string} [opts.to] ISO-8601 end
 */
export const analyticsApi = {
  getRulesAnalytics: async () => {
    return (await axiosInstance.get('/api/analytics/rules')).data;
  },

  getDashboard: async (opts = {}) => {
    const params = {};
    if (opts.from && opts.to) {
      params.from = opts.from;
      params.to = opts.to;
    } else {
      params.preset = opts.preset || 'LAST_24_HOURS';
    }
    return (await axiosInstance.get('/api/analytics/dashboard', { params })).data;
  },
};
