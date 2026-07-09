/**
 * API Configuration and Base Setup
 * Centralized API calls with JWT authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Best-effort OS detection from the browser so the AI can generate an accurate
 * remediation_script instead of asking or guessing. Returns null (not "other") when
 * unknown so the backend/agent can tell "unknown" apart from a real value.
 */
export function detectReportedPlatform() {
  try {
    const platform = String(
      navigator?.userAgentData?.platform ?? navigator?.platform ?? ''
    ).toLowerCase();
    const ua = String(navigator?.userAgent ?? '').toLowerCase();
    if (platform.includes('win') || ua.includes('windows')) return 'windows';
    if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) return 'macos';
    if (platform.includes('linux') || ua.includes('linux')) return 'linux';
  } catch {
    // navigator unavailable (SSR/tests) -- fall through to unknown
  }
  return null;
}

/**
 * GET /api/auth/profile/ returns UserProfileSerializer: user_email, user_full_name, user_id.
 * Map to the flat shape the UI expects (email, full_name, id).
 */
export function normalizeSessionUser(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const email = String(raw.email ?? raw.user_email ?? '').trim();
  const fullName = String(raw.full_name ?? raw.user_full_name ?? '').trim();
  // user_id first: /api/auth/profile/ is UserProfileSerializer (Meta.model = Profile), so its
  // own `id` field is the Profile's PK, not the User's -- `user_id` (source='user.id') is the
  // real one. Preferring `raw.id` here silently sent the wrong id to any endpoint expecting an
  // actual User pk (e.g. assign_ticket's agent_id), producing "No User matches the given query."
  const id = raw.user_id ?? raw.id;
  return {
    ...raw,
    id,
    email: email || undefined,
    full_name: fullName || undefined,
    is_platform_agent: Boolean(raw.is_platform_agent),
    can_access_escalation_queue: Boolean(raw.can_access_escalation_queue),
  };
}

/** Platform support staff or team owners may use the escalation queue. */
export function userCanAccessEscalationQueue(user) {
  if (!user) return false;
  return Boolean(user.can_access_escalation_queue);
}

function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null) return;
    const str = String(value).trim();
    if (!str || str === 'undefined' || str === 'null') return;
    search.append(key, str);
  });
  return search.toString();
}

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
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return normalizeSessionUser(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    if (user == null) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(normalizeSessionUser(user)));
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
            const next = `${window.location.pathname}${window.location.search || ''}`;
            window.location.href = `/login?next=${encodeURIComponent(next)}`;
            throw new Error('Session expired. Please login again.');
          }
        } catch (error) {
          TokenService.clearTokens();
          const next = `${window.location.pathname}${window.location.search || ''}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          throw error;
        }
      } else {
        TokenService.clearTokens();
        const next = `${window.location.pathname}${window.location.search || ''}`;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        throw new Error('Unauthorized');
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/** Monthly AI agent quota exhausted (HTTP 429 from Django). */
export class AgentQuotaExceededError extends Error {
  constructor(message, payload = {}) {
    super(message || 'Your monthly AI agent limit has been reached.');
    this.name = 'AgentQuotaExceededError';
    this.code = 'agent_quota_exceeded';
    this.agent_operations_used = payload.agent_operations_used;
    this.agent_operations_limit = payload.agent_operations_limit;
    this.detail = payload.detail;
  }
}

export function isAgentQuotaError(error) {
  return error instanceof AgentQuotaExceededError || error?.code === 'agent_quota_exceeded';
}

/**
 * Structured billing errors from Django (e.g. stale gateway_subscription_id).
 * UI should offer recovery flows instead of only showing detail text.
 */
export class BillingRecoverableError extends Error {
  constructor(message, payload = {}) {
    super(message || 'Billing update could not complete.');
    this.name = 'BillingRecoverableError';
    this.billing_error = payload.billing_error;
    this.recovery = payload.recovery;
    this.payload = payload;
  }
}

export function isBillingRecoverableError(error) {
  return error instanceof BillingRecoverableError;
}

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (response.status === 429 && data && typeof data === 'object' && data.error === 'agent_quota_exceeded') {
    throw new AgentQuotaExceededError(data.detail, {
      agent_operations_used: data.agent_operations_used,
      agent_operations_limit: data.agent_operations_limit,
      detail: data.detail,
    });
  }

  if (!response.ok) {
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      data.billing_error &&
      data.recovery
    ) {
      const friendly =
        data.detail ||
        data.message ||
        'We could not complete that billing update. Try the suggested option below.';
      throw new BillingRecoverableError(typeof friendly === 'string' ? friendly : JSON.stringify(friendly), data);
    }

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

    /** Sign in with Google ID token (credential JWT from @react-oauth/google). */
    googleLogin: async (credential) => {
      const response = await apiFetch('/api/auth/google/', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
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

    /** Request password reset email (forgot password step 1) */
    requestPasswordReset: async (email) => {
      return apiFetch('/api/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    /** Reset password with token from email (forgot password step 2). Expects: email, token, new_password, confirm_password */
    resetPassword: async ({ email, token, new_password, confirm_password }) => {
      return apiFetch('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ email, token, new_password, confirm_password }),
      });
    },

    /** Verify user email with token from signup email. Expects: token, email */
    verifyUser: async ({ token, email }) => {
      return apiFetch('/api/auth/verify-user/', {
        method: 'POST',
        body: JSON.stringify({ token, email }),
      });
    },

    /** Resend verification code to email (for unverified users) */
    resendVerificationCode: async (email) => {
      return apiFetch('/api/auth/resend-verification-code/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    getCurrentUser: async () => {
      const data = await apiFetch('/api/auth/profile/');
      return normalizeSessionUser(data);
    },
  },

  // Ticket endpoints
  tickets: {
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiFetch(`/api/tickets/list/${queryString ? '?' + queryString : ''}`);
    },

    /** GET — category value/label pairs from Ticket model choices (authoritative). */
    getCategories: async () => apiFetch('/api/tickets/categories/'),

    /** Escalated tickets visible to the current user (created by or assigned to them) */
    getEscalationQueue: async (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/api/tickets/escalated/${qs ? '?' + qs : ''}`);
    },

    get: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/`);
    },

    /**
     * Create ticket (JSON). Pass `{ screenshotFile: File }` in the second argument to upload
     * an image from the device via multipart/form-data.
     */
    create: async (ticketData, options = {}) => {
      const { screenshotFile } = options;
      if (ticketData.reported_platform === undefined) {
        const detected = detectReportedPlatform();
        if (detected) ticketData = { ...ticketData, reported_platform: detected };
      }
      if (screenshotFile) {
        const fd = new FormData();
        Object.entries(ticketData).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          fd.append(k, String(v));
        });
        fd.append('screenshot', screenshotFile);
        return apiFetch('/api/tickets/', {
          method: 'POST',
          body: fd,
          isFormData: true,
        });
      }
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

    /** Returns { my_tickets, community_resolved } (legacy array responses are normalized in App). */
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

    escalate: async (ticketId, body = {}) => {
      return apiFetch(`/api/tickets/${ticketId}/escalate/`, {
        method: 'POST',
        body: JSON.stringify(body),
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

    /** GET /api/tickets/reply-needed-count/ -> { count } */
    replyNeededCount: async () => {
      return apiFetch('/api/tickets/reply-needed-count/');
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

  // Workflows endpoints
  workflows: {
    /** GET /api/workflows/, optionally filtered to one ticket or overdue steps. */
    list: async ({ ticket, overdue } = {}) => {
      const params = new URLSearchParams();
      if (ticket) params.set('ticket', ticket);
      if (overdue) params.set('overdue', '1');
      const qs = params.toString() ? `?${params.toString()}` : '';
      return apiFetch(`/api/workflows/${qs}`);
    },

    templates: async () => {
      return apiFetch('/api/workflows/templates/');
    },

    /** GET/POST /api/workflows/templates/manage/ — admin list + create */
    listTemplatesManage: async () => {
      return apiFetch('/api/workflows/templates/manage/');
    },

    createTemplate: async (payload) => {
      return apiFetch('/api/workflows/templates/manage/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateTemplate: async (templateId, payload) => {
      return apiFetch(`/api/workflows/templates/${templateId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    deleteTemplate: async (templateId) => {
      return apiFetch(`/api/workflows/templates/${templateId}/`, { method: 'DELETE' });
    },

    assigneeRoles: async () => {
      return apiFetch('/api/workflows/assignee-roles/');
    },

    /** GET /api/workflows/playbooks/employee-onboarding/ — sellable onboarding SKU bundle */
    onboardingPlaybook: async () => {
      return apiFetch('/api/workflows/playbooks/employee-onboarding/');
    },

    /** POST /api/workflows/ -- body: { template_id, ticket_id? } */
    create: async ({ templateId, ticketId } = {}) => {
      return apiFetch('/api/workflows/', {
        method: 'POST',
        body: JSON.stringify({ template_id: templateId, ticket_id: ticketId }),
      });
    },

    claimStep: async (workflowId, stepId) => {
      return apiFetch(`/api/workflows/${workflowId}/steps/${stepId}/claim/`, { method: 'POST' });
    },

    completeStep: async (workflowId, stepId) => {
      return apiFetch(`/api/workflows/${workflowId}/steps/${stepId}/complete/`, { method: 'POST' });
    },

    rerunAutoCheck: async (workflowId, stepId) => {
      return apiFetch(`/api/workflows/${workflowId}/steps/${stepId}/auto-check/`, { method: 'POST' });
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

    /** GET /api/tickets/outcome-metrics/ — deflection, escalated, workflow counts */
    getOutcomeMetrics: async () => {
      return apiFetch('/api/tickets/outcome-metrics/');
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

    listCommunityQuestions: async (params = {}) => {
      const qs = buildQueryString(params);
      return apiFetch(`/api/knowledge_base/community/questions/${qs ? `?${qs}` : ''}`);
    },

    getCommunityQuestion: async (questionId) => {
      return apiFetch(`/api/knowledge_base/community/questions/${questionId}/`);
    },

    getPublicCommunityQuestion: async (questionId, slugAndId) => {
      const base = `/api/knowledge_base/community/public/questions/`;
      if (slugAndId) {
        return apiFetch(`${base}${encodeURIComponent(slugAndId)}/`);
      }
      return apiFetch(`${base}${questionId}/`);
    },

    createCommunityQuestion: async (payload) => {
      return apiFetch('/api/knowledge_base/community/questions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    addCommunityAnswer: async (questionId, payload) => {
      return apiFetch(`/api/knowledge_base/community/questions/${questionId}/answers/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    addCommunityQuestionComment: async (questionId, payload) => {
      return apiFetch(`/api/knowledge_base/community/questions/${questionId}/comments/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    addCommunityAnswerComment: async (answerId, payload) => {
      return apiFetch(`/api/knowledge_base/community/answers/${answerId}/comments/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    voteCommunityQuestion: async (questionId, value) => {
      return apiFetch(`/api/knowledge_base/community/questions/${questionId}/vote/`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });
    },

    voteCommunityAnswer: async (answerId, value) => {
      return apiFetch(`/api/knowledge_base/community/answers/${answerId}/vote/`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });
    },

    acceptCommunityAnswer: async (answerId) => {
      return apiFetch(`/api/knowledge_base/community/answers/${answerId}/accept/`, {
        method: 'POST',
      });
    },

    uploadCommunityAttachment: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch('/api/knowledge_base/community/attachments/upload/', {
        method: 'POST',
        body: formData,
        isFormData: true,
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

    /** GET /api/users/mention-suggestions/?q=... */
    mentionSuggestions: async (q) => {
      const qs = buildQueryString({ q });
      return apiFetch(`/api/users/mention-suggestions/${qs ? `?${qs}` : ''}`);
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

    /** Pending invitations you sent as team owner */
    sentInvitations: async (teamId) => {
      return apiFetch(`/api/teams/${teamId}/invitations/sent/`);
    },

    resendInvitation: async (invitationId) => {
      return apiFetch(`/api/teams/invitations/${invitationId}/resend/`, { method: 'POST' });
    },

    cancelInvitation: async (invitationId) => {
      return apiFetch(`/api/teams/invitations/${invitationId}/cancel/`, { method: 'POST' });
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
    /** Dodo (or future gateway): server creates checkout session; redirect browser to checkout_url */
    createCheckoutSession: async ({ plan, billing_interval, return_url }) => {
      const body = { plan, billing_interval };
      if (return_url) body.return_url = return_url;
      return apiFetch('/api/billing/checkout/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    /** Change plan for existing Dodo subscribers (uses Dodo change-plan API) */
    changePlan: async ({ plan, billing_interval }) => {
      return apiFetch('/api/billing/change-plan/', {
        method: 'POST',
        body: JSON.stringify({ plan, billing_interval }),
      });
    },
    /** Open Dodo customer portal (update payment methods, view invoices) */
    openCustomerPortal: async () => {
      return apiFetch('/api/billing/customer-portal/', { method: 'POST' });
    },
    /** Logged-in user message to support; stored and emailed to SUPPORT_CONTACT_NOTIFY_EMAILS / SUPPORT_EMAIL */
    submitSupportContact: async ({ message, subject, page_context }) => {
      return apiFetch('/api/billing/support-contact/', {
        method: 'POST',
        body: JSON.stringify({
          message,
          subject: subject || '',
          page_context: page_context || 'billing',
        }),
      });
    },
    /**
     * Staff only (Django is_staff): grant or extend a user's subscription without Dodo checkout.
     * Body: user_id, plan_id (UUIDs), optional months_valid (1–60), clear_gateway (default true), note.
     */
    staffGrantSubscription: async ({
      user_id,
      plan_id,
      months_valid = 12,
      clear_gateway = true,
      note = '',
    }) => {
      return apiFetch('/api/billing/staff/grant-subscription/', {
        method: 'POST',
        body: JSON.stringify({
          user_id,
          plan_id,
          months_valid,
          clear_gateway,
          note,
        }),
      });
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

  /** Automation rules (Phase 2) */
  automation: {
    metadata: async () => apiFetch('/api/automation/metadata/'),
    listRules: async () => apiFetch('/api/automation/rules/'),
    createRule: async (payload) =>
      apiFetch('/api/automation/rules/', { method: 'POST', body: JSON.stringify(payload) }),
    updateRule: async (ruleId, payload) =>
      apiFetch(`/api/automation/rules/${ruleId}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteRule: async (ruleId) =>
      apiFetch(`/api/automation/rules/${ruleId}/`, { method: 'DELETE' }),
    dryRunRule: async (ruleId, payload = {}) =>
      apiFetch(`/api/automation/rules/${ruleId}/dry-run/`, { method: 'POST', body: JSON.stringify(payload) }),
    logs: async () => apiFetch('/api/automation/logs/'),
  },

  /** Slack & future channel integrations */
  integrations: {
    slackStatus: async (teamId) => {
      const q = teamId ? `?team_id=${encodeURIComponent(teamId)}` : '';
      return apiFetch(`/api/integrations/slack/status/${q}`);
    },
    /** Returns Slack OAuth authorize URL (requires team_id). */
    slackAuthorizeUrl: async (teamId) => {
      if (!teamId) {
        throw new Error('team_id is required to connect Slack');
      }
      const data = await apiFetch(
        `/api/integrations/slack/oauth/start/?team_id=${encodeURIComponent(teamId)}&format=json`
      );
      if (!data?.authorize_url) {
        throw new Error(data?.detail || 'Could not start Slack OAuth');
      }
      return data.authorize_url;
    },
    slackDisconnect: async (teamId) => {
      if (!teamId) {
        throw new Error('team_id is required to disconnect Slack');
      }
      return apiFetch('/api/integrations/slack/disconnect/', {
        method: 'POST',
        body: JSON.stringify({ team_id: teamId }),
      });
    },
    teamsStatus: async (teamId) => {
      const q = teamId ? `?team_id=${encodeURIComponent(teamId)}` : '';
      return apiFetch(`/api/integrations/teams/status/${q}`);
    },
    /** Generates a short-lived linking code (no OAuth redirect for Teams — see Settings UI). */
    teamsLinkStart: async (teamId) => {
      if (!teamId) {
        throw new Error('team_id is required to connect Microsoft Teams');
      }
      return apiFetch(`/api/integrations/teams/link/start/?team_id=${encodeURIComponent(teamId)}`);
    },
    teamsDisconnect: async (teamId) => {
      if (!teamId) {
        throw new Error('team_id is required to disconnect Microsoft Teams');
      }
      return apiFetch('/api/integrations/teams/disconnect/', {
        method: 'POST',
        body: JSON.stringify({ team_id: teamId }),
      });
    },
    webhookMetadata: async () => apiFetch('/api/integrations/webhooks/metadata/'),
    listWebhooks: async () => apiFetch('/api/integrations/webhooks/'),
    createWebhook: async (payload) =>
      apiFetch('/api/integrations/webhooks/', { method: 'POST', body: JSON.stringify(payload) }),
    updateWebhook: async (endpointId, payload) =>
      apiFetch(`/api/integrations/webhooks/${endpointId}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteWebhook: async (endpointId) =>
      apiFetch(`/api/integrations/webhooks/${endpointId}/`, { method: 'DELETE' }),
    testWebhook: async (endpointId, payload = {}) =>
      apiFetch(`/api/integrations/webhooks/${endpointId}/test/`, { method: 'POST', body: JSON.stringify(payload) }),
    webhookDeliveries: async () => apiFetch('/api/integrations/webhooks/deliveries/'),
    oktaStatus: async (teamId) => {
      const q = teamId ? `?team_id=${encodeURIComponent(teamId)}` : '';
      return apiFetch(`/api/integrations/okta/status/${q}`);
    },
    oktaAuthorizeUrl: async (teamId, oktaDomain) => {
      if (!teamId || !oktaDomain) {
        throw new Error('team_id and okta_domain are required to connect Okta');
      }
      const data = await apiFetch(
        `/api/integrations/okta/oauth/start/?team_id=${encodeURIComponent(teamId)}&okta_domain=${encodeURIComponent(oktaDomain)}&format=json`
      );
      if (!data?.authorize_url) {
        throw new Error(data?.detail || 'Could not start Okta OAuth');
      }
      return data.authorize_url;
    },
    oktaDisconnect: async (teamId) => {
      if (!teamId) {
        throw new Error('team_id is required to disconnect Okta');
      }
      return apiFetch('/api/integrations/okta/disconnect/', {
        method: 'POST',
        body: JSON.stringify({ team_id: teamId }),
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
          max_results: options.maxResults || 5,
          min_relevance: options.minRelevance || 0.7,
        }),
      });
    },

    // Get proactive AI recommendations
    getRecommendations: async () => {
      return apiFetch('/api/tickets/agent/recommendations/');
    },

    // Process ticket with AI agent
    processTicket: async (ticketId, options = {}) => {
      return apiFetch(`/api/tickets/${ticketId}/process/`, {
        method: 'POST',
        body: JSON.stringify(options), // Supports { force: true } or { reset: true }
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

    // Get task status (for polling after processing)
    getTaskStatus: async (taskId) => {
      return apiFetch(`/api/tickets/tasks/${taskId}/status/`);
    },

    // Get action history for a ticket
    getActionHistory: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/action-history/`);
    },

    // Rollback an action
    rollbackAction: async (actionHistoryId, reason) => {
      return apiFetch(`/api/tickets/actions/${actionHistoryId}/rollback/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    // Submit resolution feedback
    submitResolutionFeedback: async (ticketId, feedback) => {
      return apiFetch(`/api/tickets/${ticketId}/resolution-feedback/`, {
        method: 'POST',
        body: JSON.stringify(feedback),
      });
    },

    // Get resolution analytics
    getResolutionAnalytics: async () => {
      return apiFetch('/api/tickets/resolution-analytics/');
    },

    // Chat endpoints for real-time AI interaction
    sendChatMessage: async (ticketId, message, conversationId = null) => {
      return apiFetch(`/api/tickets/${ticketId}/chat/`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      });
    },

    getChatHistory: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/chat/history/`);
    },

    /** Teammate's reply to the customer -- lands in the same chat thread (requires the ticket to be claimed). */
    sendAgentReply: async (ticketId, message) => {
      return apiFetch(`/api/tickets/${ticketId}/chat/agent-reply/`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },

    submitChatFeedback: async (ticketId, messageId, helpful, comment = null) => {
      const body = {
        rating: helpful ? 'helpful' : 'not_helpful',
      };
      // Omit comment when unset — JSON null becomes Python None and broke NOT NULL feedback_comment before server fix.
      if (comment != null && String(comment).length > 0) {
        body.comment = comment;
      }
      return apiFetch(`/api/tickets/${ticketId}/chat/${messageId}/feedback/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    /** Thumbs on synthetic first message from ticket.agent_response (no chat row). */
    submitInitialSolutionFeedback: async (ticketId, helpful) => {
      return apiFetch(`/api/tickets/${ticketId}/chat/initial-solution-feedback/`, {
        method: 'POST',
        body: JSON.stringify({
          rating: helpful ? 'helpful' : 'not_helpful',
        }),
      });
    },

    getFeedbackPrompts: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/feedback-prompts/`);
    },

    getChatSuggestions: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/chat/suggestions/`);
    },

    // NEW: Dashboard Summary (single API call - replaces 7 calls)
    getDashboardSummary: async () => {
      return apiFetch('/api/tickets/agent/dashboard-summary/');
    },

    // NEW: Paginated Action History
    getActionHistoryPaginated: async (ticketId, page = 1, limit = 20, sort = 'desc') => {
      return apiFetch(`/api/tickets/${ticketId}/action-history-paginated/?page=${page}&limit=${limit}&sort=${sort}`);
    },

    // NEW: Filtered Recommendations
    getFilteredRecommendations: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.confidence_min !== undefined) params.append('confidence_min', filters.confidence_min);
      if (filters.confidence_max !== undefined) params.append('confidence_max', filters.confidence_max);
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.limit) params.append('limit', filters.limit);
      
      return apiFetch(`/api/tickets/agent/recommendations/filtered/?${params.toString()}`);
    },

    // NEW: Batch Operations
    batchProcess: async (ticket_ids, action, force = false) => {
      return apiFetch('/api/tickets/agent/batch-process/', {
        method: 'POST',
        body: JSON.stringify({
          ticket_ids,
          action, // 'process', 'accept', or 'reject'
          force,
        }),
      });
    },

    // NEW: Batch Status
    getBatchStatus: async (batchId) => {
      return apiFetch(`/api/tickets/agent/batch/${batchId}/status/`);
    },

    // NEW: Action Validation
    validateAction: async (ticketId, actionType, solutionData = {}) => {
      return apiFetch(`/api/tickets/${ticketId}/actions/validate/`, {
        method: 'POST',
        body: JSON.stringify({
          action_type: actionType,
          solution_data: solutionData,
        }),
      });
    },

    // NEW: Solution Templates (Browse & Apply)
    getTemplateCategories: async () => {
      return apiFetch('/api/tickets/agent/templates/categories/');
    },

    getTemplatesByCategory: async (category) => {
      return apiFetch(`/api/tickets/agent/templates/?category=${category}`);
    },

    searchTemplates: async (query) => {
      return apiFetch(`/api/tickets/agent/templates/?search=${encodeURIComponent(query)}`);
    },

    applyTemplate: async (ticketId, templateId, customizations = {}) => {
      return apiFetch(`/api/tickets/${ticketId}/apply-template/`, {
        method: 'POST',
        body: JSON.stringify({
          template_id: templateId,
          customizations,
        }),
      });
    },

    // NEW: Confidence Explanation (AI Transparency)
    getConfidenceExplanation: async (ticketId) => {
      return apiFetch(`/api/tickets/${ticketId}/confidence-explanation/`);
    },

    // NEW: Similar Tickets
    getSimilarTickets: async (ticketId, threshold = 0.7, limit = 5, status = null) => {
      const params = new URLSearchParams({ threshold, limit });
      if (status) params.append('status', status);
      return apiFetch(`/api/tickets/${ticketId}/similar/?${params.toString()}`);
    },
  },
};

export default api;
