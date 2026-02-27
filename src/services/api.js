/**
 * API Configuration and Base Setup
 * Centralized API calls with JWT authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
export const TokenService = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Base fetch wrapper with authentication
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = TokenService.getAccessToken();

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Remove isFormData flag from config
  delete config.isFormData;

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && token) {
      const refreshToken = TokenService.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_URL}/api/auth/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            TokenService.setTokens(data.access, null);
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${data.access}`;
            const retryResponse = await fetch(url, { ...config, headers });
            return handleResponse(retryResponse);
          } else {
            // Refresh failed, logout user
            TokenService.clearTokens();
            window.location.href = '/';
            throw new Error('Session expired. Please login again.');
          }
        } catch (error) {
          TokenService.clearTokens();
          window.location.href = '/';
          throw error;
        }
      } else {
        TokenService.clearTokens();
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Prefer explicit message/error/detail; then first field error from DRF serializer.errors
    let msg = data && (data.message || data.error || (Array.isArray(data.detail) ? data.detail[0] : data.detail));
    if (msg == null && data && typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0];
      const firstVal = firstKey ? data[firstKey] : null;
      msg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
    }
    const error = typeof msg === 'string' ? msg : (data && typeof data === 'object' ? JSON.stringify(data) : data) || response.statusText;
    throw new Error(error);
  }

  return data;
};

// API Service
export const api = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      const response = await apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      // Backend returns access_token/refresh_token; also support access/refresh
      const access = response.access ?? response.access_token;
      const refresh = response.refresh ?? response.refresh_token;
      if (access && refresh) {
        TokenService.setTokens(access, refresh);
      }
      return response;
    },
    
    register: async (userData) => {
      return apiFetch('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    
    logout: () => {
      TokenService.clearTokens();
    },

    resetPassword: async (email) => {
      return apiFetch('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    getCurrentUser: async () => {
      return apiFetch('/api/auth/profile/');
    },
  },

  // Ticket endpoints
  tickets: {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiFetch(`/api/tickets/list/${queryString ? '?' + queryString : ''}`);
    },

    get: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/`);
    },

    create: async (ticketData) => {
      return apiFetch('/api/tickets/', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
    },

    update: async (ticketId, data) => {
      return apiFetch(`/api/tickets/${ticketId}/update/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/delete/`, {
        method: 'DELETE',
      });
    },

    search: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return apiFetch(`/api/tickets/search/?${queryString}`);
    },

    addComment: async (ticketId, comment) => {
      return apiFetch(`/api/tickets/${ticketId}/comment/`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
    },

    escalate: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/escalate/`, {
        method: 'POST',
      });
    },

    assign: async (ticketId, agentId) => {
      return apiFetch(`/api/tickets/${ticketId}/assign/`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId }),
      });
    },

    updateStatus: async (ticketId, status) => {
      return apiFetch(`/api/tickets/${ticketId}/status/`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
    },

    history: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/history/`);
    },

    /** GET /api/tickets/<ticket_id>/action-history/ */
    actionHistory: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/action-history/`);
    },

    /** POST /api/tickets/actions/<uuid>/rollback/ (admin only) */
    rollbackAction: async (actionId, body) => {
      return apiFetch(`/api/tickets/actions/${actionId}/rollback/`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      });
    },

    /** POST /api/tickets/<ticket_id>/resolution-feedback/ */
    submitResolutionFeedback: async (ticketId, payload) => {
      return apiFetch(`/api/tickets/${ticketId}/resolution-feedback/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    processWithAgent: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/process/`, {
        method: 'POST',
      });
    },

    uploadAttachment: async (ticketId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = TokenService.getAccessToken();
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      return handleResponse(response);
    },
  },

  // Analytics endpoints
  analytics: {
    getTicketAnalytics: async () => {
      return apiFetch('/api/tickets/analytics/');
    },

    /** GET /api/tickets/resolution-analytics/ */
    getResolutionAnalytics: async () => {
      return apiFetch('/api/tickets/resolution-analytics/');
    },

    getDashboard: async () => {
      return apiFetch('/api/tickets/dashboard/');
    },
  },

  // Knowledge Base endpoints
  knowledgeBase: {
    search: async (query) => {
      const data = await apiFetch(`/api/knowledge_base/articles/?q=${encodeURIComponent(query)}`);
      return Array.isArray(data) ? data : (data?.results || data?.data || []);
    },

    list: async () => {
      const data = await apiFetch('/api/knowledge_base/articles/');
      return Array.isArray(data) ? data : (data?.results || data?.data || []);
    },

    get: async (id) => {
      return apiFetch(`/api/knowledge_base/articles/${id}/`);
    },

    rate: async (id, isHelpful) => {
      return apiFetch(`/api/knowledge_base/articles/${id}/rate/`, {
        method: 'POST',
        body: JSON.stringify({ is_helpful: isHelpful }),
      });
    },
  },

  // Users management endpoints
  users: {
    list: async () => {
      return apiFetch('/api/users/');
    },

    /** Users in any of the current user's teams (for Users tab). */
    listTeamMembers: async () => {
      return apiFetch('/api/users/team-members/');
    },

    get: async (userId) => {
      return apiFetch(`/api/users/${userId}/`);
    },

    create: async (userData) => {
      return apiFetch('/api/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    update: async (userId, userData) => {
      return apiFetch(`/api/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
      });
    },

    delete: async (userId) => {
      return apiFetch(`/api/users/${userId}/`, {
        method: 'DELETE',
      });
    },
  },

  // Teams management endpoints
  teams: {
    list: async () => {
      return apiFetch('/api/teams/');
    },

    limits: async () => {
      return apiFetch('/api/teams/limits/');
    },

    get: async (teamId) => {
      return apiFetch(`/api/teams/${teamId}/`);
    },

    create: async (teamData) => {
      return apiFetch('/api/teams/create/', {
        method: 'POST',
        body: JSON.stringify(teamData),
      });
    },

    update: async (teamId, teamData) => {
      return apiFetch(`/api/teams/${teamId}/update/`, {
        method: 'PATCH',
        body: JSON.stringify(teamData),
      });
    },

    delete: async (teamId) => {
      return apiFetch(`/api/teams/${teamId}/delete/`, {
        method: 'DELETE',
      });
    },

    invitations: async () => {
      return apiFetch('/api/teams/invitations/');
    },

    invite: async (teamId, email) => {
      return apiFetch(`/api/teams/${teamId}/invite/`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    },

    acceptInvitation: async (invitationId) => {
      return apiFetch(`/api/teams/invitations/${invitationId}/accept/`, { method: 'POST' });
    },

    declineInvitation: async (invitationId) => {
      return apiFetch(`/api/teams/invitations/${invitationId}/decline/`, { method: 'POST' });
    },

    leave: async (teamId) => {
      return apiFetch(`/api/teams/${teamId}/leave/`, { method: 'POST' });
    },

    removeMember: async (teamId, userId) => {
      return apiFetch(`/api/teams/${teamId}/members/remove/`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
    },
  },

  // Billing & subscription (synced with backend)
  billing: {
    getPlans: async () => {
      const data = await apiFetch('/api/billing/plans/');
      return Array.isArray(data) ? data : (data?.results || []);
    },
    getSubscription: async () => {
      return apiFetch('/api/billing/subscription/');
    },
    updateSubscription: async (payload) => {
      return apiFetch('/api/billing/subscription/', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    getUsage: async () => {
      return apiFetch('/api/billing/usage/');
    },
    getInvoices: async () => {
      const data = await apiFetch('/api/billing/invoices/');
      return Array.isArray(data) ? data : (data?.results || []);
    },
  },

  // Solutions endpoints
  solutions: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams(params).toString();
      return apiFetch(`/api/solutions/${queryParams ? `?${queryParams}` : ''}`);
    },

    get: async (solutionId) => {
      return apiFetch(`/api/solutions/${solutionId}/`);
    },

    create: async (solutionData) => {
      return apiFetch('/api/solutions/', {
        method: 'POST',
        body: JSON.stringify(solutionData),
      });
    },

    update: async (solutionId, solutionData) => {
      return apiFetch(`/api/solutions/${solutionId}/`, {
        method: 'PATCH',
        body: JSON.stringify(solutionData),
      });
    },

    verify: async (solutionId) => {
      return apiFetch(`/api/solutions/${solutionId}/verify/`, {
        method: 'POST',
      });
    },

    // Knowledge Base entries (from solutions app)
    kbEntries: {
      list: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiFetch(`/api/solutions/kb/${queryParams ? `?${queryParams}` : ''}`);
      },

      get: async (entryId) => {
        return apiFetch(`/api/solutions/kb/${entryId}/`);
      },

      create: async (entryData) => {
        return apiFetch('/api/solutions/kb/', {
          method: 'POST',
          body: JSON.stringify(entryData),
        });
      },

      update: async (entryId, entryData) => {
        return apiFetch(`/api/solutions/kb/${entryId}/`, {
          method: 'PATCH',
          body: JSON.stringify(entryData),
        });
      },

      delete: async (entryId) => {
        return apiFetch(`/api/solutions/kb/${entryId}/`, {
          method: 'DELETE',
        });
      },

      incrementViews: async (entryId) => {
        return apiFetch(`/api/solutions/kb/${entryId}/view/`, {
          method: 'POST',
        });
      },
    },
  },

  // User settings and preferences
  settings: {
    getProfile: async () => {
      return apiFetch('/api/auth/profile/');
    },

    updateProfile: async (profileData) => {
      return apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
    },

    uploadProfileImage: async (formData) => {
      return apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: formData,
        isFormData: true,
      });
    },

    changePassword: async (passwordData) => {
      return apiFetch('/api/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    },

    // User preferences endpoints
    getPreferences: async () => {
      return apiFetch('/api/auth/preferences/');
    },

    updatePreferences: async (preferencesData) => {
      return apiFetch('/api/auth/preferences/', {
        method: 'PATCH',
        body: JSON.stringify(preferencesData),
      });
    },
  },

  // In-app notifications (header bell)
  notifications: {
    list: async () => apiFetch('/api/auth/notifications/'),
    markRead: async (notificationId) =>
      apiFetch(`/api/auth/notifications/${notificationId}/read/`, { method: 'PATCH' }),
    markAllRead: async () =>
      apiFetch('/api/auth/notifications/read-all/', { method: 'POST' }),
  },

  // AI Agent endpoints
  agent: {
    // Get agent analytics and performance metrics
    getAnalytics: async () => {
      return apiFetch('/api/tickets/agent/analytics/');
    },

    // Enhanced knowledge base search using AI agent
    searchKnowledgeBase: async (query, options = {}) => {
      return apiFetch('/api/tickets/agent/kb-search/', {
        method: 'POST',
        body: JSON.stringify({
          query,
          limit: options.limit || 5,
          category: options.category,
          min_helpfulness: options.minHelpfulness,
        }),
      });
    },

    // Get proactive AI recommendations
    getRecommendations: async () => {
      return apiFetch('/api/tickets/agent/recommendations/');
    },

    // Process ticket with AI agent
    processTicket: async (ticketId, reset = false) => {
      return apiFetch(`/api/tickets/${ticketId}/process/`, {
        method: 'POST',
        body: JSON.stringify({ reset }),
      });
    },

    // Get agent status for a ticket
    getTicketAgentStatus: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/agent-status/`);
    },

    // Get AI suggestions for a ticket
    getTicketSuggestions: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/ai-suggestions/`);
    },
  },
};

export default api;
