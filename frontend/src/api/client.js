const BASE_URL = '/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('hg_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'omit'
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Failed to parse server response.'
  }));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/auth/me'),

  // Requests
  createRequest: (payload) => apiFetch('/requests', { method: 'POST', body: JSON.stringify(payload) }),
  getRequest: (id) => apiFetch(`/requests/${id}`),
  getStudentDashboard: () => apiFetch('/requests/student/feed'),
  approveRequest: (requestId) => apiFetch(`/requests/${requestId}/approve`, { method: 'POST' }),
  rejectRequest: (requestId, reason) => apiFetch(`/requests/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  cancelRequest: (requestId, accessToken) => apiFetch(`/requests/${requestId}/cancel`, { method: 'POST', body: JSON.stringify(accessToken ? { accessToken } : {}) }),
  updateRequest: (requestId, payload) => apiFetch(`/requests/${requestId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  submitDraft: (requestId, accessToken) => apiFetch(`/requests/${requestId}/submit`, { method: 'POST', body: JSON.stringify(accessToken ? { accessToken } : {}) }),

  // Gate Security
  verifyGatePass: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/gate/verify?${query}`);
  },
  recordGateCheckIn: (payload) => apiFetch('/gate/checkin', { method: 'POST', body: JSON.stringify(payload) }),
  recordGateCheckOut: (payload) => apiFetch('/gate/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getActiveInsideVisitors: (hostelId) => apiFetch(`/gate/active-visitors${hostelId ? `?hostelId=${hostelId}` : ''}`),

  // Guard Attendance
  checkInShift: (hostelId) => apiFetch('/attendance/checkin', { method: 'POST', body: JSON.stringify({ hostelId }) }),
  checkOutShift: () => apiFetch('/attendance/checkout', { method: 'POST' }),
  getGuardShiftStatus: () => apiFetch('/attendance/my-status'),
  getAllAttendance: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/all?${query}`);
  },
  getAssignableGuards: (hostelId) => apiFetch(`/attendance/guards${hostelId ? `?hostelId=${hostelId}` : ''}`),
  getShiftAssignments: (params) => apiFetch(`/attendance/assignments?${new URLSearchParams(params).toString()}`),
  assignGuardShift: (payload) => apiFetch('/attendance/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  removeGuardShiftAssignment: (shiftId) => apiFetch(`/attendance/assignments/${shiftId}`, { method: 'DELETE' }),

  // Warden
  getWardenDashboard: (hostelId) => apiFetch(`/warden/dashboard${hostelId ? `?hostelId=${hostelId}` : ''}`),
  getOverstayAlerts: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/warden/alerts?${query}`);
  },
  acknowledgeAlert: (alertId, notes) => apiFetch(`/warden/alerts/${alertId}/acknowledge`, { method: 'POST', body: JSON.stringify({ notes }) }),
  updateStudentStatus: (rollNumber, status) => apiFetch(`/warden/students/${rollNumber}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Workers
  getWorkers: (hostelId) => apiFetch(`/workers${hostelId ? `?hostelId=${hostelId}` : ''}`),
  registerWorker: (payload) => apiFetch('/workers', { method: 'POST', body: JSON.stringify(payload) }),
  logWorkerActivity: (payload) => apiFetch('/workers/gate-activity', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getSystemOverview: () => apiFetch('/admin/overview'),
  getAllUsers: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/users?${query}`);
  },
  updateUserStatus: (userId, status) => apiFetch(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignUserRole: (userId, role, profile) => apiFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role, profile }) }),
  getAuditLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/audit-logs?${query}`);
  },
  getDirectorySyncStatus: () => apiFetch('/admin/directory/status'),
  syncStudentDirectory: () => apiFetch('/admin/directory/sync', { method: 'POST' }),

  // Reports
  getHistoricalVisits: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/history?${query}`);
  },
  getDailyReport: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/daily-summary?${query}`);
  },

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  markNotificationRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiFetch('/notifications/mark-all-read', { method: 'POST' })
};
