import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add common headers
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error('Unauthorized access');
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', data?.message || error.message);
      }

      throw new Error(data?.message || `HTTP ${status} Error`);
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      console.error('Error:', error.message);
      throw new Error(error.message);
    }
  }
);

// Poll API endpoints
export const pollAPI = {
  // Get all active polls
  getPolls: async () => {
    try {
      const response = await api.get('/polls');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific poll details
  getPoll: async (pollId) => {
    try {
      const response = await api.get(`/polls/${pollId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get poll results (for real-time updates)
  getPollResults: async (pollId) => {
    try {
      const response = await api.get(`/polls/${pollId}/results`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cast vote
  castVote: async (pollId, voteData) => {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, voteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Token API endpoints
export const tokenAPI = {
  // Request voting token
  requestToken: async (tokenData) => {
    try {
      const response = await api.post('/request-token', tokenData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify token
  verifyToken: async (token, pollId) => {
    try {
      const response = await api.get(`/request-token/verify/${token}`, {
        params: { pollId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend token
  resendToken: async (tokenData) => {
    try {
      const response = await api.post('/request-token/resend', tokenData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Admin API endpoints (for future use)
export const adminAPI = {
  // Create poll
  createPoll: async (pollData, adminSecret) => {
    try {
      const response = await api.post('/admin/polls', pollData, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate AI poll
  generateAIPoll: async (promptData, adminSecret) => {
    try {
      const response = await api.post('/admin/generate-poll', promptData, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get admin polls
  getAdminPolls: async (adminSecret, params = {}) => {
    try {
      const response = await api.get('/admin/polls', {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get poll audit
  getPollAudit: async (pollId, adminSecret) => {
    try {
      const response = await api.get(`/admin/polls/${pollId}/audit`, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get system stats
  getStats: async (adminSecret) => {
    try {
      const response = await api.get('/admin/stats', {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update poll
  updatePoll: async (pollId, updateData, adminSecret) => {
    try {
      const response = await api.put(`/admin/polls/${pollId}`, updateData, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete poll
  deletePoll: async (pollId, adminSecret) => {
    try {
      const response = await api.delete(`/admin/polls/${pollId}`, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific admin poll
  getAdminPoll: async (pollId, adminSecret) => {
    try {
      const response = await api.get(`/admin/polls/${pollId}`, {
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// System API endpoints
export const systemAPI = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get API info
  getAPIInfo: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  // Format API error for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Check if error is a rate limit error
  isRateLimitError: (error) => {
    return error.response?.status === 429;
  },

  // Check if error is a validation error
  isValidationError: (error) => {
    return error.response?.status === 400 &&
           error.response?.data?.error === 'Validation Error';
  },

  // Extract validation errors
  getValidationErrors: (error) => {
    if (apiUtils.isValidationError(error)) {
      return error.response.data.details || [];
    }
    return [];
  },

  // Check if poll is active
  isPollActive: (poll) => {
    return poll && poll.isActive === true;
  },

  // Format poll date
  formatPollDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Calculate percentage
  calculatePercentage: (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  },
};

export default api;
