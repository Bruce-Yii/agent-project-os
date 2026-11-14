// WP1-C Web/API shell — Fastify 5.
// Integrated with WP1-A: uses real CommandExecutor + PostgreSQL when DATABASE_URL is set.
// Falls back to in-memory mock mode with a clear warning when DATABASE_URL is absent or DB unavailable.

import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// ---------------------------------------------------------------------------
// Module loading helpers (src .mjs -> compiled dist .js)
// ---------------------------------------------------------------------------
async function loadModule(rel) {
  const candidates = [
    path.resolve(__dirname, rel), // when running from a copied dist location
    path.resolve(__dirname, '..', '..', 'dist', 'src', rel.replace(/^\.\.\//, '')), // from src/http -> dist/src
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      return import(pathToFileURL(c).href);
    }
  }
  return import(rel);
}

// ---------------------------------------------------------------------------
// Mode + storage
// ---------------------------------------------------------------------------
const inMemoryProjects = new Map();
const inMemoryTasks = new Map();
const inMemoryRuns = new Map();
const inMemoryReviews = new Map();
const inMemoryAgentSessions = new Map();

let mode = 'mock-in-memory'; // 'real' | 'mock-in-memory'
let db = null;
let pool = null;
let closeDbFn = null;
let executor = null;
let ProjectRepositoryCls = null;
let TaskRepositoryCls = null;
let AgentSessionRepositoryCls = null;
let schemaMod = null;
let handlersMap = {};

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isReal() {
  return mode === 'real' && executor !== null && db !== null;
}

// ---------------------------------------------------------------------------
// Paseo adapter helper
// ---------------------------------------------------------------------------
async function tryConnectPaseo() {
  try {
    const adapterPath = process.env.PASEO_ADAPTER_PATH || path.resolve(__dirname, '..', 'runtime', 'paseo-adapter.mjs');
    const mod = await import(pathToFileURL(adapterPath).href);
    const AdapterCls = mod.default || mod.PaseoRuntimeAdapter;
    if (!AdapterCls) return null;
    const adapter = new AdapterCls({ daemonUrl: process.env.PASEO_DAEMON_URL || 'ws://127.0.0.1:6767/ws' });
    const connectTimeoutMs = Number(process.env.PASEO_CONNECT_TIMEOUT_MS || 3000);
    await Promise.race([
      adapter.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Paseo connect timeout')), connectTimeoutMs)),
    ]);
    return adapter;
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Database bootstrap
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL || '';
const PORT = Number(process.env.PORT || 3000);

if (DATABASE_URL) {
  try {
    const dbMod = await loadModule('../persistence/db.js');
    const migrateMod = await loadModule('../persistence/migrate.js');
    const execMod = await loadModule('../commands/executor.js');
    const reposMod = await loadModule('../persistence/repositories.js');
    schemaMod = await loadModule('../persistence/schema.js');
    const handlersMod = await loadModule('../commands/handlers.js');

    const { createDb } = dbMod;
    closeDbFn = dbMod.closeDb;
    const { migrate } = migrateMod;
    const { CommandExecutor } = execMod;
    ProjectRepositoryCls = reposMod.ProjectRepository;
    TaskRepositoryCls = reposMod.TaskRepository;
    AgentSessionRepositoryCls = reposMod.AgentSessionRepository;
    handlersMap = (handlersMod && handlersMod.handlers) || {};

    const created = createDb(DATABASE_URL);
    db = created.db;
    pool = created.pool;

    await migrate(DATABASE_URL);

    executor = new CommandExecutor({ db, pool });
    mode = 'real';
    console.log('WP1-A integration: connected to PostgreSQL; migrations applied.');
    console.log('Mode: real (CommandExecutor + PostgreSQL)');
  } catch (err) {
    console.error('WP1-A integration: failed to connect to PostgreSQL, falling back to mock mode.', err);
    if (pool && closeDbFn) {
      try { await closeDbFn(pool); } catch { /* ignore */ }
    }
    db = null;
    pool = null;
    executor = null;
    mode = 'mock-in-memory';
  }
} else {
  console.warn('WARNING: DATABASE_URL is not set. Falling back to mock-in-memory mode (NOT persisted).');
  console.warn('Set DATABASE_URL to enable real PostgreSQL + CommandExecutor mode.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEnvelope(overrides = {}) {
  const now = new Date().toISOString();
  return {
    commandId: randomUUID(),
    idempotencyKey: randomUUID(),
    actor: 'personal-owner-1',
    personalSpaceId: 'ps-1',
    createdAt: now,
    correlationId: randomUUID(),
    causationId: randomUUID(),
    ...overrides,
  };
}

function projectToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    spaceId: row.spaceId,
    name: row.name,
    goal: row.goal,
    status: row.status,
    currentState: row.currentState,
    currentStateFreshness: row.currentStateFreshness,
    currentStateSource: row.currentStateSource,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function taskToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    scope: row.scope,
    nonScope: row.nonScope,
    acceptanceCriteria: row.acceptanceCriteria,
    parentId: row.parentId,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'agent-project-os',
    version: '0.0.0-dev',
    mode,
    db: isReal() ? 'connected' : 'disconnected',
  };
});

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------
fastify.get('/v1/capabilities', async () => {
  const paseoAdapter = await tryConnectPaseo();
  const paseoConnected = !!paseoAdapter;
  if (paseoAdapter) { try { await paseoAdapter.disconnect(); } catch { /* ignore */ } }

  if (isReal()) {
    return {
      service: 'agent-project-os',
      version: '0.0.0-dev',
      mode: 'real',
      db: 'connected',
      real: [
        'health check',
        'PostgreSQL persistence (WP1-A)',
        'CommandExecutor (WP1-A) with authorization, idempotency, receipts',
        'projects: create/read/list (persistent)',
        'tasks: create/read/list (persistent, validates projectId exists)',
        'project current-state read (persistent)',
        'POST /v1/commands for implemented intents',
        paseoConnected ? 'providers: list (real via Paseo)' : 'providers: list (mock — Paseo not connected)',
        paseoConnected ? 'agent sessions: create/list (real via Paseo)' : 'agent sessions: (mock — Paseo not connected)',
      ],
      mock: [
        'agent sessions / providers / runs / assignments / artifacts / approvals (in-memory)',
        'reviews: list pending (in-memory)',
        'events / cursors / SSE / WebSocket',
        'attention: DEFERRED (WP1-C module contract v0.1 for review/approval/attention)',
      ],
      deferred: [
        'attention: DEFERRED — requires WP1-C module contract v0.1 (review/approval/attention)',
      ],
      requires: [
        'WP1-B Module Acceptance for provider/session/runtime',
        'WP1-C module contract v0.1 for assignment/run/review/approval',
      ],
    };
  }
  return {
    service: 'agent-project-os',
    version: '0.0.0-dev',
    mode: 'mock-in-memory',
    db: 'disconnected',
    real: [
      'health check',
    ],
    mock: [
      'persistence (no PostgreSQL; in-memory only)',
      'projects: create/read/list (in-memory, non-persistent)',
      'tasks: create/read/list (in-memory, validates projectId exists)',
      'reviews: list pending (in-memory)',
      'project current-state read (in-memory stub)',
      'POST /v1/commands (not implemented -> 501 NOT_IMPLEMENTED)',
      'agent sessions / providers / runs / assignments / artifacts / approvals',
      paseoConnected ? 'providers: list (real via Paseo)' : 'providers: list (mock — Paseo not connected)',
      paseoConnected ? 'agent sessions: create/list (real via Paseo)' : 'agent sessions: list (mock — Paseo not connected)',
      'attention: DEFERRED (WP1-C module contract v0.1 for review/approval/attention)',
      'current-state writes',
      'events / cursors / SSE / WebSocket',
    ],
    deferred: [
      'attention: DEFERRED — requires WP1-C module contract v0.1 (review/approval/attention)',
    ],
    requires: [
      'Set DATABASE_URL to enable real PostgreSQL + CommandExecutor mode',
      'WP1-A Gate 0 PASS for persistence + domain code',
      'WP1-B Module Acceptance for provider/session/runtime',
      'WP1-C module contract v0.1 for assignment/run/review/approval',
    ],
  };
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
fastify.get('/v1/projects', async () => {
  if (isReal()) {
    const repo = new ProjectRepositoryCls(db);
    // List all projects (single personal space in WP1-A v0).
    let rows = [];
    try {
      if (schemaMod && db.select) {
        rows = await db.select().from(schemaMod.projects);
      } else {
        rows = await repo.findBySpace('ps-1');
      }
    } catch (e) {
      rows = await repo.findBySpace('ps-1');
    }
    return { projects: rows.map(projectToApi) };
  }
  return { projects: Array.from(inMemoryProjects.values()) };
});

fastify.get('/v1/projects/:id', async (request, reply) => {
  if (isReal()) {
    const repo = new ProjectRepositoryCls(db);
    const project = await repo.findById(request.params.id);
    if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
    return projectToApi(project);
  }
  const project = inMemoryProjects.get(request.params.id);
  if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
  return project;
});

fastify.post('/v1/projects', async (request, reply) => {
  const { name, goal } = request.body || {};
  if (!isNonEmptyString(name)) {
    return reply.status(400).send({ reason: 'MISSING_NAME', message: 'name is required and must be a non-empty string' });
  }
  if (isReal()) {
    const envelope = makeEnvelope();
    const result = await executor.execute({
      envelope,
      intent: 'CreateProject',
      payload: { name: name.trim(), goal: goal || '' },
    });
    if (result.status !== 'OK') {
      const status = result.reason === 'NOT_FOUND' ? 404 : 400;
      return reply.status(status).send({ reason: result.reason || 'REJECTED', message: result.reason });
    }
    const repo = new ProjectRepositoryCls(db);
    const project = await repo.findById(result.projectId);
    const apiProject = project ? projectToApi(project) : {
      id: result.projectId,
      name: name.trim(),
      goal: goal || '',
      status: result.projectStatus || 'draft',
      version: result.version,
    };
    return reply.status(201).send(apiProject);
  }
  // mock
  const id = `proj-${randomUUID()}`;
  const project = { id, name: name.trim(), goal: goal || '', status: 'draft', createdAt: new Date().toISOString(), version: 1 };
  inMemoryProjects.set(id, project);
  return reply.status(201).send(project);
});

fastify.get('/v1/projects/:id/tasks', async (request) => {
  if (isReal()) {
    const repo = new TaskRepositoryCls(db);
    const rows = await repo.findByProject(request.params.id);
    return { tasks: rows.map(taskToApi) };
  }
  const projectId = request.params.id;
  return { tasks: Array.from(inMemoryTasks.values()).filter(t => t.projectId === projectId) };
});

fastify.get('/v1/projects/:id/current-state', async (request, reply) => {
  if (isReal()) {
    const repo = new ProjectRepositoryCls(db);
    const project = await repo.findById(request.params.id);
    if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
    return { projectId: project.id, currentState: project.currentState || null, version: project.version };
  }
  const project = inMemoryProjects.get(request.params.id);
  if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
  return { projectId: project.id, currentState: project.currentState || null, version: project.version };
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
fastify.post('/v1/tasks', async (request, reply) => {
  const { projectId, title, scope, acceptanceCriteria } = request.body || {};
  if (!isNonEmptyString(projectId)) {
    return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'projectId is required' });
  }
  if (!isNonEmptyString(title)) {
    return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'title is required and must be a non-empty string' });
  }
  if (isReal()) {
    // validate project exists
    const prepo = new ProjectRepositoryCls(db);
    const project = await prepo.findById(projectId);
    if (!project) return reply.status(404).send({ reason: 'PROJECT_NOT_FOUND', message: `project ${projectId} does not exist` });

    const envelope = makeEnvelope({ projectId });
    const result = await executor.execute({
      envelope,
      intent: 'CreateTask',
      payload: { projectId, title: title.trim(), scope: scope || '', acceptanceCriteria: acceptanceCriteria || '' },
    });
    if (result.status !== 'OK') {
      const status = result.reason === 'NOT_FOUND' ? 404 : 400;
      return reply.status(status).send({ reason: result.reason || 'REJECTED', message: result.reason });
    }
    const trepo = new TaskRepositoryCls(db);
    const task = await trepo.findById(result.taskId);
    const apiTask = task ? taskToApi(task) : {
      id: result.taskId,
      projectId,
      title: title.trim(),
      status: result.taskStatus || 'backlog',
      version: result.version,
    };
    return reply.status(201).send(apiTask);
  }
  // mock
  if (!inMemoryProjects.has(projectId)) {
    return reply.status(404).send({ reason: 'PROJECT_NOT_FOUND', message: `project ${projectId} does not exist` });
  }
  const id = `task-${randomUUID()}`;
  const task = { id, projectId, title: title.trim(), scope: scope || '', acceptanceCriteria: acceptanceCriteria || '', status: 'backlog', version: 1, createdAt: new Date().toISOString() };
  inMemoryTasks.set(id, task);
  return reply.status(201).send(task);
});

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
fastify.post('/v1/commands', async (request, reply) => {
  const { intent, payload, envelope } = request.body || {};
  if (!intent) {
    return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'intent is required' });
  }
  if (!(intent in handlersMap)) {
    return reply.status(501).send({
      status: 'NOT_IMPLEMENTED',
      intent,
      mode,
      message: 'Command intent is not implemented. Real command execution requires a supported WP1-A handler.',
    });
  }
  if (!isReal()) {
    return reply.status(501).send({
      status: 'NOT_IMPLEMENTED',
      intent,
      mode: 'mock-in-memory',
      message: 'Command execution requires real PostgreSQL mode (set DATABASE_URL).',
    });
  }
  const cmd = {
    envelope: makeEnvelope(envelope || {}),
    intent,
    payload: payload || {},
  };
  const result = await executor.execute(cmd);
  return reply.status(200).send(result);
});

// (consolidated into labeled endpoints below)
// ---------------------------------------------------------------------------
// Reviews (mock)
// ---------------------------------------------------------------------------
fastify.get('/v1/reviews/pending', async () => {
  return { reviews: Array.from(inMemoryReviews.values()).filter(r => r.status === 'pending'), mode: 'mock-in-memory' };
});

// ---------------------------------------------------------------------------
// Providers (WP1-B not connected -> mock, clearly labeled)
// ---------------------------------------------------------------------------
fastify.get('/v1/providers', async () => {
  let providers = null;
  let source = 'mock';
  try {
    const adapterPath = process.env.PASEO_ADAPTER_PATH || path.resolve(__dirname, '..', 'runtime', 'paseo-adapter.mjs');
    if (adapterPath) {
      const mod = await import(pathToFileURL(adapterPath).href);
      const AdapterCls = mod.default || mod.PaseoRuntimeAdapter;
      if (AdapterCls) {
        const adapter = new AdapterCls({ daemonUrl: process.env.PASEO_DAEMON_URL || 'ws://127.0.0.1:6767/ws' });
        await adapter.connect();
        const discovered = await adapter.discover();
        if (Array.isArray(discovered)) {
          providers = discovered.map((p) => ({
            id: p.name || p.id || 'provider',
            name: p.name || p.id || 'provider',
            available: !!p.available,
            status: p.available ? 'available' : 'unavailable',
            level: p.level || (p.available ? 'native' : 'unsupported'),
            error: p.error || null,
            source: 'paseo',
            mock: false,
          }));
          source = 'paseo';
          await adapter.disconnect();
        }
      }
    }
  } catch (err) {
    providers = null;
    source = 'mock';
  }

  if (!providers) {
    providers = [
      { id: 'claude', name: 'claude', available: true, status: 'available', level: 'native', error: null, source: 'mock', mock: true, note: 'requires interactive OAuth login' },
      { id: 'codex', name: 'codex', available: true, status: 'available', level: 'native', error: null, source: 'mock', mock: true, note: 'requires interactive OAuth login' },
      { id: 'opencode', name: 'opencode', available: true, status: 'available', level: 'native', error: null, source: 'mock', mock: true, note: 'requires credits' },
      { id: 'pi', name: 'pi', available: true, status: 'available', level: 'native', error: null, source: 'mock', mock: true, note: 'requires /login' },
      { id: 'copilot', name: 'copilot', available: false, status: 'unavailable', level: 'unsupported', error: 'requires GitHub Copilot subscription', source: 'mock', mock: true, note: 'requires GitHub Copilot subscription' },
    ];
    source = 'mock';
  }

  const mode = source === 'paseo' ? 'real' : 'mock-in-memory';
  return {
    providers,
    mode,
    source,
    mock: source !== 'paseo',
    note: 'Provider list from Paseo Daemon (real).',
  };
});

// ---------------------------------------------------------------------------
// Agent sessions (Paseo-backed when adapter available, else mock)
// ---------------------------------------------------------------------------
fastify.post('/v1/agents/sessions', async (request, reply) => {
  const body = request.body || {};
  const { provider, cwd, title } = body;
  if (!isNonEmptyString(provider)) {
    return reply.status(400).send({ reason: 'MISSING_PROVIDER', message: 'provider is required and must be a non-empty string' });
  }

  const adapter = await tryConnectPaseo();
  if (!adapter) {
    return reply.status(503).send({
      reason: 'PASEO_UNAVAILABLE',
      message: 'Paseo Runtime Adapter is not available; cannot create a real session.',
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
    });
  }

  try {
    const created = await adapter.createSession(provider.trim(), cwd || process.cwd(), title || '');
    await adapter.disconnect();

    const record = {
      id: created.sessionId,
      sessionId: created.sessionId,
      providerSessionId: created.providerSessionId || created.sessionId,
      provider: created.provider || provider.trim(),
      cwd: created.cwd || cwd || process.cwd(),
      title: title || '',
      status: created.status || 'idle',
      projectId: (body && body.projectId) || null,
      taskId: (body && body.taskId) || null,
      assignmentId: (body && body.assignmentId) || null,
      capabilities: created.capabilities || (body && body.capabilities) || null,
      model: created.model || null,
      createdAt: created.createdAt || new Date().toISOString(),
      updatedAt: created.updatedAt || new Date().toISOString(),
      source: 'paseo',
      mock: false,
      resumeType: null,
    };

    // Persist to durable registry when DB is available.
    if (isReal() && AgentSessionRepositoryCls) {
      try {
        const repo = new AgentSessionRepositoryCls(db);
        await repo.save({
          id: record.id,
          providerSessionId: record.providerSessionId,
          provider: record.provider,
          cwd: record.cwd,
          title: record.title,
          status: record.status,
          projectId: record.projectId,
          taskId: record.taskId,
          assignmentId: record.assignmentId,
          capabilities: record.capabilities ? JSON.stringify(record.capabilities) : null,
        });
      } catch (e) {
        fastify.log.error(e);
        try { await adapter.disconnect(); } catch { /* ignore */ }
        return reply.status(500).send({
          reason: 'DB_SAVE_FAILED',
          message: e && e.message ? e.message : String(e),
          mode: 'real',
          source: 'paseo',
          mock: false,
        });
      }
    }
    // Keep in-memory cache for mock/legacy paths.
    inMemoryAgentSessions.set(created.sessionId, record);

    return reply.status(201).send({
      ...record,
      mode: 'real',
      source: 'paseo',
      mock: false,
      note: 'Real Paseo session created.',
    });
  } catch (err) {
    try { await adapter.disconnect(); } catch { /* ignore */ }
    return reply.status(502).send({
      reason: 'PASEO_ERROR',
      message: err && err.message ? err.message : String(err),
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
    });
  }
});

function dbSessionToRecord(row) {
  let caps = null;
  if (row && row.capabilities) {
    try { caps = JSON.parse(row.capabilities); } catch { caps = row.capabilities; }
  }
  return {
    id: row.id,
    sessionId: row.id,
    providerSessionId: row.providerSessionId,
    provider: row.provider,
    cwd: row.cwd,
    title: row.title || '',
    status: row.status || 'idle',
    projectId: row.projectId || null,
    taskId: row.taskId || null,
    assignmentId: row.assignmentId || null,
    capabilities: caps,
    model: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    source: 'db',
    mock: false,
    resumeType: null,
  };
}

fastify.get('/v1/agents/sessions', async (request, reply) => {
  // Read durable registry (DB) when available, else in-memory cache.
  let tracked = [];
  let dbReadFailed = false;
  let dbAvailable = isReal() && !!AgentSessionRepositoryCls;
  if (dbAvailable) {
    try {
      const repo = new AgentSessionRepositoryCls(db);
      const rows = await repo.findAll();
      tracked = rows.map(dbSessionToRecord);
    } catch (e) {
      fastify.log.error(e);
      dbReadFailed = true;
      // Do not silently fall back to cache with a false 'db' label.
      return reply.status(500).send({
        reason: 'DB_READ_FAILED',
        message: e && e.message ? e.message : String(e),
        mode: 'real',
        source: 'cache',
        mock: true,
        warning: 'Database read failed; not falling back to cache.',
      });
    }
  } else {
    tracked = Array.from(inMemoryAgentSessions.values());
  }

  const adapter = await tryConnectPaseo();
  if (!adapter) {
    const sessions = tracked.map((rec) => ({ ...rec }));
    return {
      sessions,
      agents: sessions,
      mode: isReal() ? 'real' : 'mock-in-memory',
      source: dbAvailable ? 'db' : 'cache',
      mock: !dbAvailable,
      deferred: false,
      note: isReal()
        ? 'Durable agent sessions (Paseo unavailable; status not refreshed).'
        : 'Paseo Runtime Adapter not available; agent sessions unavailable.',
    };
  }

  const sessions = [];
  for (const rec of tracked) {
    let status = rec.status;
    let live = null;
    try {
      live = await adapter.getSession(rec.sessionId || rec.id);
    } catch {
      live = null;
    }
    if (live) {
      status = live.status || status;
      const updated = {
        ...rec,
        status,
        model: live.model || rec.model,
        updatedAt: live.updatedAt || rec.updatedAt,
        source: 'paseo',
        mock: false,
        resumeType: live.resumeType || rec.resumeType || null,
      };
      // Refresh durable status when possible.
      if (isReal() && AgentSessionRepositoryCls) {
        try {
          const repo = new AgentSessionRepositoryCls(db);
          await repo.updateStatus(rec.id, status);
        } catch { /* ignore */ }
      }
      // Update cache.
      inMemoryAgentSessions.set(rec.id, updated);
      sessions.push(updated);
    } else {
      sessions.push({ ...rec, status: 'unavailable', source: 'db', mock: true, resumeType: rec.resumeType || null });
    }
  }
  try { await adapter.disconnect(); } catch { /* ignore */ }

  const mode = 'real';
  return {
    sessions,
    agents: sessions,
    mode,
    source: 'paseo',
    mock: false,
    note: 'Tracked Paseo sessions with live status from Paseo Daemon.',
  };
});

// ---------------------------------------------------------------------------
// Agent session messages + timeline (Paseo-backed when adapter available)
// ---------------------------------------------------------------------------
fastify.post('/v1/agents/sessions/:id/messages', async (request, reply) => {
  const id = request.params.id;
  const body = request.body || {};
  const text = body.text ?? body.message ?? body.content;
  if (!isNonEmptyString(text)) {
    return reply.status(400).send({ reason: 'MISSING_TEXT', message: 'text is required and must be a non-empty string' });
  }

  const adapter = await tryConnectPaseo();
  if (!adapter) {
    return reply.status(200).send({
      sessionId: id,
      result: { deliveryStatus: 'queued' },
      deliveryStatus: 'queued',
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
      note: 'Paseo Runtime Adapter not available; mock fallback.',
    });
  }

  try {
    const sendFn = typeof adapter.sendMessage === 'function'
      ? adapter.sendMessage.bind(adapter)
      : (typeof adapter.sendAgentMessage === 'function' ? adapter.sendAgentMessage.bind(adapter) : null);

    if (!sendFn) {
      await adapter.disconnect();
      return reply.status(200).send({
        sessionId: id,
        result: { deliveryStatus: 'queued' },
        deliveryStatus: 'queued',
        mode: 'mock-in-memory',
        source: 'mock',
        mock: true,
        note: 'Adapter does not support sendMessage; mock fallback.',
      });
    }

    const result = await sendFn(id, text.trim(), body.options || {});
    await adapter.disconnect();
    const deliveryStatus = (result && result.deliveryStatus) || 'queued';
    return reply.status(200).send({
      sessionId: id,
      result: result || { deliveryStatus },
      deliveryStatus,
      mode: 'real',
      source: 'paseo',
      mock: false,
      note: 'Message sent via Paseo.',
    });
  } catch (err) {
    try { await adapter.disconnect(); } catch { /* ignore */ }
    return reply.status(502).send({
      reason: 'PASEO_ERROR',
      message: err && err.message ? err.message : String(err),
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
    });
  }
});

fastify.get('/v1/agents/sessions/:id/timeline', async (request, reply) => {
  const id = request.params.id;
  const options = request.query || {};

  const adapter = await tryConnectPaseo();
  if (!adapter) {
    return {
      sessionId: id,
      entries: [],
      hasOlder: false,
      hasNewer: false,
      gap: false,
      epoch: null,
      startCursor: null,
      endCursor: null,
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
      note: 'Paseo Runtime Adapter not available; mock fallback.',
    };
  }

  try {
    if (typeof adapter.fetchTimeline !== 'function') {
      await adapter.disconnect();
      return {
        sessionId: id,
        entries: [],
        hasOlder: false,
        hasNewer: false,
        gap: false,
        epoch: null,
        startCursor: null,
        endCursor: null,
        mode: 'mock-in-memory',
        source: 'mock',
        mock: true,
        note: 'Adapter does not support fetchTimeline; mock fallback.',
      };
    }

    const tl = await adapter.fetchTimeline(id, options);
    await adapter.disconnect();
    return {
      sessionId: id,
      entries: (tl && tl.entries) || [],
      hasOlder: !!(tl && tl.hasOlder),
      hasNewer: !!(tl && tl.hasNewer),
      gap: !!(tl && tl.gap),
      epoch: (tl && tl.epoch) || null,
      startCursor: (tl && tl.startCursor) || null,
      endCursor: (tl && tl.endCursor) || null,
      mode: 'real',
      source: 'paseo',
      mock: false,
      note: 'Timeline from Paseo.',
    };
  } catch (err) {
    try { await adapter.disconnect(); } catch { /* ignore */ }
    return reply.status(502).send({
      reason: 'PASEO_ERROR',
      message: err && err.message ? err.message : String(err),
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
    });
  }
});

// ---------------------------------------------------------------------------
// Agent session events (SSE)
// ---------------------------------------------------------------------------
fastify.get('/v1/agents/sessions/:id/events', async (request, reply) => {
  const id = request.params.id;
  reply.hijack();
  const res = reply.raw;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (obj) => {
    try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch { /* ignore */ }
  };

  // Register client disconnect cleanup BEFORE any async connect/backfill.
  let adapter = null;
  let unsub = null;
  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (typeof unsub === 'function') try { unsub(); } catch { /* ignore */ }
    if (adapter) try { adapter.disconnect(); } catch { /* ignore */ }
    try { res.end(); } catch { /* ignore */ }
  };
  // Client disconnect signals. In Node 24, request.raw 'close' fires on
  // request completion rather than connection close, so rely on reply.raw
  // 'close' plus request.raw 'aborted'.
  res.on('close', cleanup);
  request.raw.on('aborted', cleanup);

  try {
    adapter = await tryConnectPaseo();
  } catch (e) {
    adapter = null;
  }
  if (closed) { lateCleanup(); return; }
  if (!adapter) {
    send({ type: 'error', reason: 'PASEO_UNAVAILABLE' });
    cleanup();
    return;
  }

  // Backfill on connect.
  try {
    if (typeof adapter.fetchTimeline === 'function') {
      const tl = await adapter.fetchTimeline(id, request.query || {});
      if (closed) { cleanup(); return; }
      for (const entry of (tl && tl.entries) || []) {
        if (closed) break;
        send(entry);
      }
    }
  } catch (e) {
    if (!closed) send({ type: 'error', message: e && e.message ? e.message : String(e) });
  }
  if (closed) { lateCleanup(); return; }

  try {
    if (typeof adapter.subscribeEvents === 'function') {
      unsub = adapter.subscribeEvents(id, (event) => {
        if (!closed) send(event);
      });
      if (typeof unsub !== 'function') unsub = null;
    }
  } catch (e) {
    if (!closed) send({ type: 'error', message: e && e.message ? e.message : String(e) });
  }
  if (closed) { lateCleanup(); return; }
});

// ---------------------------------------------------------------------------
// Attention (DEFERRED — requires WP1-C module contract v0.1)
// ---------------------------------------------------------------------------
fastify.get('/v1/attention', async () => {
  const items = [];
  return {
    items,
    attention: items,
    attentionItems: items,
    pending: items,
    mode: 'deferred',
    source: 'mock',
    mock: true,
    deferred: true,
    label: 'DEFERRED',
    note: 'Attention system requires WP1-C module contract v0.1 (review/approval/attention). Currently deferred.',
  };
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '127.0.0.1' });
    console.log(`Agent Project OS server running at http://127.0.0.1:${PORT}`);
    console.log(`Mode: ${mode}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  try { await fastify.close(); } catch { /* ignore */ }
  if (pool && closeDbFn) {
    try { await closeDbFn(pool); } catch { /* ignore */ }
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
