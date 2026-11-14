// WP1-C Web/API shell — Fastify 5.
// Integrated with WP1-A: uses real CommandExecutor + PostgreSQL when DATABASE_URL is set.
// Falls back to in-memory mock mode with a clear warning when DATABASE_URL is absent or DB unavailable.

import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { streamAgentEvents } from './sse-stream.mjs';

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
    const connectPromise = Promise.resolve().then(() => adapter.connect());
    let timeoutHandle;
    try {
      await Promise.race([
        connectPromise,
        new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Paseo connect timeout')), connectTimeoutMs);
        }),
      ]);
      return adapter;
    } catch (error) {
      // If the timeout wins but the socket connects later, release that late connection.
      void connectPromise.then(() => adapter.disconnect()).catch(() => {});
      throw error;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
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
async function createSessionCreationIntent(body, provider, cwd, title) {
  const id = randomUUID();
  const idempotencyKey = `project-os-session:${id}`;
  await pool.query(
    `INSERT INTO agent_session_creation_intents
      (id, idempotency_key, provider, cwd, title, project_id, task_id, assignment_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
    [id, idempotencyKey, provider, cwd, title,
      body.projectId || null, body.taskId || null, body.assignmentId || null],
  );
  return { id, idempotencyKey };
}

async function persistSessionAndIntent(intentId, record) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO agent_sessions
        (id, provider_session_id, provider, cwd, title, status, project_id, task_id,
         assignment_id, capabilities, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         provider_session_id=EXCLUDED.provider_session_id,
         provider=EXCLUDED.provider, cwd=EXCLUDED.cwd, title=EXCLUDED.title,
         status=EXCLUDED.status, project_id=EXCLUDED.project_id, task_id=EXCLUDED.task_id,
         assignment_id=EXCLUDED.assignment_id, capabilities=EXCLUDED.capabilities,
         updated_at=NOW()`,
      [record.id, record.providerSessionId, record.provider, record.cwd, record.title,
        record.status, record.projectId, record.taskId, record.assignmentId,
        record.capabilities ? JSON.stringify(record.capabilities) : null],
    );
    const updated = await client.query(
      `UPDATE agent_session_creation_intents
       SET status='committed', provider_session_id=$2, last_error=NULL, updated_at=NOW()
       WHERE id=$1`,
      [intentId, record.id],
    );
    if (updated.rowCount !== 1) throw new Error('SESSION_CREATION_INTENT_NOT_FOUND');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function updateSessionCreationIntent(intentId, status, providerSessionId, errorMessage) {
  await pool.query(
    `UPDATE agent_session_creation_intents
     SET status=$2, provider_session_id=COALESCE($3, provider_session_id),
         last_error=$4, updated_at=NOW()
     WHERE id=$1`,
    [intentId, status, providerSessionId || null, errorMessage || null],
  );
}

function sessionRecordFromProvider(created, body, provider, cwd, title) {
  if (!created || !created.sessionId) throw new Error('PASEO_CREATE_RETURNED_NO_SESSION_ID');
  return {
    id: created.sessionId,
    sessionId: created.sessionId,
    providerSessionId: created.providerSessionId || created.sessionId,
    provider: created.provider || provider,
    cwd: created.cwd || cwd,
    title,
    status: created.status || 'idle',
    projectId: body.projectId || null,
    taskId: body.taskId || null,
    assignmentId: body.assignmentId || null,
    capabilities: created.capabilities || body.capabilities || null,
    model: created.model || null,
    createdAt: created.createdAt || new Date().toISOString(),
    updatedAt: created.updatedAt || new Date().toISOString(),
    source: 'paseo',
    mock: false,
    resumeType: null,
  };
}

// Reconcile durable intents after a process restart. Paseo's createAgent idempotencyKey
// makes retrying an uncertain create safe; known remote IDs are looked up first.
async function reconcilePendingAgentSessionCreations() {
  if (!isReal() || !pool) return;
  const { rows } = await pool.query(
    `SELECT * FROM agent_session_creation_intents
     WHERE status IN ('pending','reconciliation_required')
     ORDER BY created_at ASC LIMIT 50`,
  );
  if (!rows.length) return;
  const adapter = await tryConnectPaseo();
  if (!adapter) {
    fastify.log.warn({ pending: rows.length }, 'Session creation reconciliation deferred: Paseo unavailable');
    return;
  }
  try {
    for (const intent of rows) {
      try {
        let created = null;
        if (intent.provider_session_id && typeof adapter.getSession === 'function') {
          try { created = await adapter.getSession(intent.provider_session_id); } catch { created = null; }
        }
        if (!created) {
          created = await adapter.createSession(intent.provider, intent.cwd, intent.title, {
            idempotencyKey: intent.idempotency_key,
          });
        }
        const body = {
          projectId: intent.project_id,
          taskId: intent.task_id,
          assignmentId: intent.assignment_id,
        };
        const record = sessionRecordFromProvider(created, body, intent.provider, intent.cwd, intent.title);
        await persistSessionAndIntent(intent.id, record);
        inMemoryAgentSessions.set(record.id, record);
        fastify.log.info({ intentId: intent.id, sessionId: record.id }, 'Reconciled agent session creation intent');
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        await updateSessionCreationIntent(intent.id, 'reconciliation_required', intent.provider_session_id, message).catch(() => {});
        fastify.log.error({ intentId: intent.id, err: error }, 'Agent session creation reconciliation failed');
      }
    }
  } finally {
    await adapter.disconnect().catch(() => {});
  }
}

fastify.post('/v1/agents/sessions', async (request, reply) => {
  const body = request.body || {};
  const { provider } = body;
  const cwd = body.cwd || process.cwd();
  const title = body.title || '';
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

  let intent = null;
  let stage = 'intent';
  let created = null;
  let record = null;
  try {
    // The durable intent is committed BEFORE the remote side effect.
    if (isReal() && pool) {
      intent = await createSessionCreationIntent(body, provider.trim(), cwd, title);
    }
    stage = 'provider-create';
    created = await adapter.createSession(provider.trim(), cwd, title,
      intent ? { idempotencyKey: intent.idempotencyKey } : {});
    record = sessionRecordFromProvider(created, body, provider.trim(), cwd, title);

    if (intent) {
      stage = 'db-persist';
      await persistSessionAndIntent(intent.id, record);
    }

    inMemoryAgentSessions.set(record.id, record);
    return reply.status(201).send({
      ...record,
      mode: 'real',
      source: 'paseo',
      mock: false,
      note: 'Real Paseo session created and registered.',
    });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (intent && stage === 'db-persist' && record) {
      let compensationStatus = 'reconciliation_required';
      let compensationError = null;
      try {
        if (typeof adapter.deleteSession !== 'function') {
          throw new Error('PASEO_DELETE_SESSION_UNSUPPORTED');
        }
        await adapter.deleteSession(record.id);
        compensationStatus = 'compensated';
      } catch (deleteError) {
        compensationError = deleteError && deleteError.message ? deleteError.message : String(deleteError);
      }
      await updateSessionCreationIntent(
        intent.id,
        compensationStatus,
        record.id,
        compensationError || message,
      ).catch((updateError) => fastify.log.error({ intentId: intent.id, err: updateError }, 'Could not persist session compensation result'));
      return reply.status(500).send({
        reason: 'DB_SAVE_FAILED',
        message,
        compensationStatus,
        compensationError,
        mode: 'real',
        source: 'paseo',
        mock: false,
      });
    }

    if (intent) {
      await updateSessionCreationIntent(intent.id, 'reconciliation_required', created && created.sessionId, message)
        .catch((updateError) => fastify.log.error({ intentId: intent.id, err: updateError }, 'Could not persist uncertain session creation'));
    }
    if (stage === 'intent') {
      return reply.status(500).send({ reason: 'DB_INTENT_FAILED', message, mode: 'real', source: 'db', mock: false });
    }
    return reply.status(502).send({
      reason: 'PASEO_ERROR',
      message,
      mode: 'mock-in-memory',
      source: 'mock',
      mock: true,
    });
  } finally {
    await adapter.disconnect().catch((error) => fastify.log.warn({ err: error }, 'Paseo adapter disconnect failed'));
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
  await streamAgentEvents({
    request,
    reply,
    connect: tryConnectPaseo,
    sessionId: request.params.id,
  });
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
    if (isReal()) {
      void reconcilePendingAgentSessionCreations().catch((error) =>
        fastify.log.error({ err: error }, 'Session creation reconciliation startup failed'),
      );
    }
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
