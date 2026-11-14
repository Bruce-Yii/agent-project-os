// Paseo Runtime Adapter — Project OS LocalRuntimeNode wrapper for Paseo Daemon 0.15.4
//
// Wraps @getpaseo/client DaemonClient to provide a stable LocalRuntimeNode interface
// for Project OS. Maps Paseo concepts to Project OS domain objects.
//
// Capabilities are reported per-provider as: native / emulated / unsupported / unknown

export class PaseoRuntimeAdapter {
  constructor(options = {}) {
    this.daemonUrl = options.daemonUrl || 'ws://127.0.0.1:6767/ws';
    this.clientId = options.clientId || 'project-os-runtime';
    this.appVersion = options.appVersion || '0.15.4';
    this.client = null;
    this.connected = false;
  }

  async connect() {
    const { DaemonClient } = await import('@getpaseo/client/internal/daemon-client');
    this.client = new DaemonClient({
      url: this.daemonUrl,
      clientId: this.clientId,
      clientType: 'cli',
      appVersion: this.appVersion,
    });
    await this.client.connect();
    this.connected = true;
  }

  async disconnect() {
    if (this.client) {
      await (this.client.disconnect ? this.client.disconnect() : this.client.close?.());
      this.connected = false;
      this.client = null;
    }
  }

  async discover() {
    this._ensureConnected();
    const result = await this.client.listAvailableProviders();
    const providers = result.providers || result || [];
    return providers.map(p => ({
      name: p.provider,
      available: p.available,
      error: p.error || null,
      level: p.available ? 'native' : 'unsupported',
    }));
  }

  async createSession(provider, cwd, title, options = {}) {
    this._ensureConnected();
    const agent = await this.client.createAgent({ provider, cwd, title, ...options });
    return this._mapAgent(agent);
  }

  async resumeSession(sessionId) {
    this._ensureConnected();
    try {
      const result = await this.client.fetchAgent(sessionId);
      const agent = result.agent || result;
      return this._mapAgent(agent);
    } catch (e) {
      return null;
    }
  }

  async sendMessage(sessionId, text, options = {}) {
    this._ensureConnected();
    return await this.client.sendAgentMessage(sessionId, text, options);
  }

  subscribeEvents(sessionId, callback) {
    this._ensureConnected();
    return this.client.subscribeAgentTimeline(sessionId, (msg) => {
      const event = this._mapEvent(msg, sessionId);
      callback(event);
    });
  }

  async getSession(sessionId) {
    return this.resumeSession(sessionId);
  }

  async fetchTimeline(sessionId, options = {}) {
    this._ensureConnected();
    const result = await this.client.fetchAgentTimeline(sessionId, options);
    return {
      entries: result.entries || [],
      hasOlder: result.hasOlder || false,
      hasNewer: result.hasNewer || false,
      gap: result.gap || false,
      epoch: result.epoch || null,
      startCursor: result.startCursor || null,
      endCursor: result.endCursor || null,
    };
  }

  getCapabilities(provider) {
    const caps = {
      streaming: 'native',
      sessionPersistence: 'native',
      sessionListing: 'native',
      dynamicModes: 'native',
      mcpServers: 'native',
      reasoningStream: 'native',
      toolInvocations: 'native',
      rewindConversation: 'native',
      rewindFiles: 'native',
      nativeResume: 'emulated',
      twoClientAttach: 'native',
      reconnectBackfill: 'native',
    };
    return Object.entries(caps).map(([name, level]) => ({ name, level }));
  }

  _ensureConnected() {
    if (!this.connected || !this.client) {
      throw new Error('Runtime not connected. Call connect() first.');
    }
  }

  _mapAgent(agent) {
    if (!agent) return null;
    const a = agent.agent || agent;
    return {
      sessionId: a.id,
      providerSessionId: a.id,
      provider: a.provider,
      cwd: a.cwd,
      status: a.status || 'idle',
      capabilities: a.capabilities ? Object.keys(a.capabilities).filter(k => a.capabilities[k]) : [],
      model: a.model || (a.runtimeInfo && a.runtimeInfo.model) || null,
      runtimeInfo: a.runtimeInfo || null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  _mapEvent(msg, sessionId) {
    const ev = (msg && msg.payload && msg.payload.event) || msg;
    return {
      type: (ev && ev.type) || (msg && msg.type) || 'unknown',
      agentId: sessionId,
      payload: (msg && msg.payload) || msg,
      timestamp: (msg && msg.timestamp) || new Date().toISOString(),
    };
  }
}

export default PaseoRuntimeAdapter;