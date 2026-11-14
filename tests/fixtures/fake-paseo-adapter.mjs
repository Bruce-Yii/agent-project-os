// Isolated fake Paseo adapter for deterministic agent-session tests.
// Does NOT import @getpaseo. Controlled by env FAKE_PASEO_AVAILABLE ('0' => unavailable).

import { createHash, randomUUID } from 'node:crypto';

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
    const id = options.idempotencyKey
      ? `fake-session-${createHash('sha256').update(options.idempotencyKey).digest('hex').slice(0, 24)}`
      : `fake-session-${randomUUID()}`;
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
      entries: [
        { type: 'history', id: 'hist-1', sessionId, content: 'backfilled event', seq: 1 },
      ],
      hasOlder: false,
      hasNewer: false,
      gap: false,
      epoch: 'fake-epoch',
      startCursor: { epoch: 'fake-epoch', seq: 1 },
      endCursor: { epoch: 'fake-epoch', seq: 1 },
    };
  }

  subscribeEvents(sessionId, callback) {
    this._ensureConnected();
    let active = true;
    const timer = setTimeout(() => {
      if (active && typeof callback === 'function') {
        callback({ type: 'live-event', id: 'live-2', seq: 2, epoch: 'fake-epoch', sessionId, timestamp: new Date().toISOString() });
      }
    }, 50);
    const unsubscribe = () => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
    };
    unsubscribe.release = unsubscribe;
    unsubscribe.ready = Promise.resolve();
    return unsubscribe;
  }

  async deleteSession(sessionId) {
    this._ensureConnected();
    if (process.env.FAKE_PASEO_DELETE_FAIL === '1') throw new Error('fake delete failed');
    return { deleted: true, sessionId };
  }

  async fetchAgentMetadata(sessionId) {
    return this.getSession(sessionId);
  }

  async resumeSession(sessionId) {
    return this.fetchAgentMetadata(sessionId);
  }

  async nativeResume(sessionId) {
    throw new Error('native resume is not supported; use fetchAgentMetadata (metadata-lookup)');
  }

  _ensureConnected() {
    if (!this.connected) {
      throw new Error('Runtime not connected. Call connect() first.');
    }
  }
}

export default PaseoRuntimeAdapter;