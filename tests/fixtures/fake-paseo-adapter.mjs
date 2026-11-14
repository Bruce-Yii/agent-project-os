// Isolated fake Paseo adapter for deterministic agent-session tests.
// Does NOT import @getpaseo. Controlled by env FAKE_PASEO_AVAILABLE ('0' => unavailable).

import { randomUUID } from 'node:crypto';

export class PaseoRuntimeAdapter {
  constructor(options = {}) {
    this.daemonUrl = options.daemonUrl || 'ws://127.0.0.1:6767/ws';
    this.connected = false;
  }

  async connect() {
    if (process.env.FAKE_PASEO_AVAILABLE === '0') {
      throw new Error('fake paseo unavailable');
    }
    this.connected = true;
  }

  async disconnect() {
    this.connected = false;
  }

  async discover() {
    this._ensureConnected();
    return [{ name: 'fake-provider', available: true, error: null, level: 'native' }];
  }

  async createSession(provider, cwd, title, options = {}) {
    this._ensureConnected();
    const id = `fake-session-${randomUUID()}`;
    const now = new Date().toISOString();
    return {
      sessionId: id,
      providerSessionId: id,
      provider: provider,
      cwd: cwd || process.cwd(),
      status: 'idle',
      model: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getSession(sessionId) {
    this._ensureConnected();
    const now = new Date().toISOString();
    // Return an updated status to exercise status refresh.
    return {
      sessionId,
      providerSessionId: sessionId,
      status: 'running',
      model: 'fake-model',
      updatedAt: now,
      resumeType: 'metadata-lookup',
    };
  }

  async sendMessage(sessionId, text, options = {}) {
    this._ensureConnected();
    return { deliveryStatus: 'queued' };
  }

  async sendAgentMessage(sessionId, text, options = {}) {
    return this.sendMessage(sessionId, text, options);
  }

  async fetchTimeline(sessionId, options = {}) {
    this._ensureConnected();
    return {
      entries: [],
      hasOlder: false,
      hasNewer: false,
      gap: false,
      epoch: null,
      startCursor: null,
      endCursor: null,
    };
  }

  subscribeEvents(sessionId, callback) {
    this._ensureConnected();
    return () => {};
  }

  async resumeSession(sessionId) {
    return this.getSession(sessionId);
  }

  _ensureConnected() {
    if (!this.connected) {
      throw new Error('Runtime not connected. Call connect() first.');
    }
  }
}

export default PaseoRuntimeAdapter;