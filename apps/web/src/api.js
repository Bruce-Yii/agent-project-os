// Centralized typed-ish HTTP client for the WP1-C shell API.
// All fetch calls in the UI go through this module.

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '/api';

export const API = API_BASE;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (e) {
    throw new ApiError(`Network error: ${e.message}`, 0, null);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.reason)) || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  capabilities: () => request('/v1/capabilities'),
  listProjects: () => request('/v1/projects'),
  getProject: (id) => request(`/v1/projects/${encodeURIComponent(id)}`),
  createProject: (name, goal = '') => request('/v1/projects', { method: 'POST', body: JSON.stringify({ name, goal }) }),
  listTasks: (projectId) => request(`/v1/projects/${encodeURIComponent(projectId)}/tasks`),
  createTask: (projectId, title) => request('/v1/tasks', { method: 'POST', body: JSON.stringify({ projectId, title }) }),
  currentState: (projectId) => request(`/v1/projects/${encodeURIComponent(projectId)}/current-state`),
  pendingReviews: () => request('/v1/reviews/pending'),
  command: (intent, payload = {}, envelope = {}) => request('/v1/commands', { method: 'POST', body: JSON.stringify({ intent, payload, envelope }) }),
};

export default api;