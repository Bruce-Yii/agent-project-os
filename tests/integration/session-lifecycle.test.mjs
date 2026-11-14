import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDisposablePg } from '../../dist/src/persistence/disposable-pg.js';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const FAKE_ADAPTER = path.resolve(ROOT, 'tests', 'fixtures', 'fake-paseo-adapter.mjs');

const PORT_SSE = 39150;
const BASE_SSE = `http://127.0.0.1:${PORT_SSE}`;
const PORT_DB = 39151;
const BASE_DB = `http://127.0.0.1:${PORT_DB}`;

let sseServer;
let dbServer;
let pgInstance;
let dbPool;

async function startServer(port, envOverrides = {}) {
  const server = spawn(process.execPath, ['src/http/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ...envOverrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  server.stdout.on('data', (d) => { stdout += d.toString(); });
  server.stderr.on('data', (d) => { stderr += d.toString(); });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const health = await fetch(`${baseUrl}/api/health`).catch(() => null);
  if (!health || !health.ok) {
    try { server.kill(); } catch {}
    throw new Error(`Server not ready on ${port}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }
  return { server, baseUrl, stdout: () => stdout, stderr: () => stderr,
    stop: async () => {
      if (server && !server.killed) {
        server.kill();
        await new Promise((resolve) => {
          const timer = setTimeout(() => { try { server.kill('SIGKILL'); } catch {} resolve(); }, 5_000);
          server.once('exit', () => { clearTimeout(timer); resolve(); });
        });
      }
    },
  };
}

async function readSSE(url, ms = 300) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events = [];
  const start = Date.now();
  while (Date.now() - start < ms) {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ value: null, done: false, timeout: true }), 50)),
    ]);
    if (result.done) break;
    if (result.value) {
      buffer += decoder.decode(result.value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();
      for (const chunk of parts) {
        const line = chunk.split('\n').find((l) => l.startsWith('data:'));
        if (line) {
          try { events.push(JSON.parse(line.slice(5).trim())); } catch {}
        }
      }
    }
  }
  try { await reader.cancel(); } catch {}
  return { res, events };
}

before(async () => {
  // SSE server (no DB, fake adapter)
  sseServer = await startServer(PORT_SSE, {
    PASEO_ADAPTER_PATH: FAKE_ADAPTER,
    FAKE_PASEO_AVAILABLE: '1',
  });
  // DB server
  pgInstance = await startDisposablePg();
  dbServer = await startServer(PORT_DB, {
    DATABASE_URL: pgInstance.connectionUri,
    PASEO_ADAPTER_PATH: FAKE_ADAPTER,
    FAKE_PASEO_AVAILABLE: '1',
  });
  dbPool = new pg.Pool({ connectionString: pgInstance.connectionUri });
});

after(async () => {
  if (dbPool) await dbPool.end().catch(() => {});
  if (dbServer) await dbServer.stop();
  if (sseServer) await sseServer.stop();
  if (pgInstance) await pgInstance.stop().catch(() => {});
});

describe('Session lifecycle (SSE + DB)', () => {
  let sessionId;
  let durableSessionId;
  before(async () => {
    const res = await fetch(`${BASE_SSE}/v1/agents/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'fake-provider', cwd: ROOT, title: 'SSE Session' }),
    });
    const body = await res.json();
    sessionId = body.id;
  });

  test('SSE real event arrival', async () => {
    const { res, events } = await readSSE(`${BASE_SSE}/v1/agents/sessions/${sessionId}/events`, 400);
    assert.equal(res.status, 200);
    assert.ok(events.length >= 1, 'expected at least one event');
    assert.ok(events.some((e) => e.type === 'live-event'), 'expected a live subscription event, not history-only');
  });

  test('SSE client disconnect + cleanup (server stays healthy)', async () => {
    const ctrl = new AbortController();
    const p = fetch(`${BASE_SSE}/v1/agents/sessions/${sessionId}/events`, { signal: ctrl.signal });
    await new Promise((r) => setTimeout(r, 50));
    ctrl.abort();
    await p.catch(() => {});
    await new Promise((r) => setTimeout(r, 100));
    const h = await fetch(`${BASE_SSE}/api/health`);
    assert.equal(h.status, 200);
  });

  test('SSE auto-reconnect + backfill', async () => {
    const first = await readSSE(`${BASE_SSE}/v1/agents/sessions/${sessionId}/events`, 120);
    const second = await readSSE(`${BASE_SSE}/v1/agents/sessions/${sessionId}/events`, 120);
    assert.ok(first.events.some((e) => e.type === 'history'), 'first connection backfill missing');
    assert.ok(second.events.some((e) => e.type === 'history'), 'reconnect backfill missing');
  });

  test('DB session creation persists and reconciles pending intents after restart', async () => {
    const res = await fetch(`${BASE_DB}/v1/agents/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'fake-provider', cwd: ROOT, title: 'Durable Session' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    durableSessionId = body.id;
    const saved = await dbPool.query('SELECT id, provider_session_id, provider FROM agent_sessions WHERE id=$1', [durableSessionId]);
    assert.equal(saved.rows.length, 1);
    assert.equal(saved.rows[0].provider_session_id, durableSessionId);
    const intent = await dbPool.query('SELECT status FROM agent_session_creation_intents WHERE provider_session_id=$1', [durableSessionId]);
    assert.equal(intent.rows[0].status, 'committed');

    const recoveryId = 'recovery-intent-test-1';
    const recoveryKey = 'project-os-session:recovery-intent-test-1';
    await dbPool.query(
      `INSERT INTO agent_session_creation_intents
        (id, idempotency_key, provider, cwd, title, status)
       VALUES ($1,$2,'fake-provider',$3,'Restart Recovery','pending')`,
      [recoveryId, recoveryKey, ROOT],
    );

    await dbServer.stop();
    dbServer = await startServer(PORT_DB, {
      DATABASE_URL: pgInstance.connectionUri,
      PASEO_ADAPTER_PATH: FAKE_ADAPTER,
      FAKE_PASEO_AVAILABLE: '1',
    });
    const deadline = Date.now() + 5000;
    let recovered = null;
    while (Date.now() < deadline) {
      const result = await dbPool.query('SELECT status, provider_session_id FROM agent_session_creation_intents WHERE id=$1', [recoveryId]);
      if (result.rows[0]?.status === 'committed') { recovered = result.rows[0]; break; }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.ok(recovered, 'pending intent was not reconciled after process restart');
    assert.ok(recovered.provider_session_id);
    const recoveredSession = await dbPool.query('SELECT id FROM agent_sessions WHERE id=$1', [recovered.provider_session_id]);
    assert.equal(recoveredSession.rows.length, 1);
  });

  test('Session message and Timeline HTTP paths use the live adapter', async () => {
    assert.ok(durableSessionId);
    const sent = await fetch(`${BASE_DB}/v1/agents/sessions/${durableSessionId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'hello from lifecycle test' }),
    });
    assert.equal(sent.status, 200);
    const sentBody = await sent.json();
    assert.equal(sentBody.source, 'paseo');
    assert.equal(sentBody.mock, false);
    assert.equal(sentBody.deliveryStatus, 'queued');

    const timeline = await fetch(`${BASE_DB}/v1/agents/sessions/${durableSessionId}/timeline`);
    assert.equal(timeline.status, 200);
    const timelineBody = await timeline.json();
    assert.equal(timelineBody.source, 'paseo');
    assert.equal(timelineBody.mock, false);
    assert.ok(timelineBody.entries.some((entry) => entry.type === 'history'));
  });

  test('DB save failure -> 500', async () => {
    // Drop table to force save failure.
    await dbPool.query('DROP TABLE IF EXISTS agent_sessions CASCADE');
    const res = await fetch(`${BASE_DB}/v1/agents/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'fake-provider', cwd: ROOT, title: 'DB Fail Session' }),
    });
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.reason, 'DB_SAVE_FAILED');
    assert.equal(body.compensationStatus, 'compensated');
    const compensated = await dbPool.query(
      `SELECT status, provider_session_id FROM agent_session_creation_intents
       WHERE status='compensated' ORDER BY created_at DESC LIMIT 1`,
    );
    assert.equal(compensated.rows[0]?.status, 'compensated');
    assert.ok(compensated.rows[0]?.provider_session_id);
    // restore table via migration? recreate minimal
    await dbPool.query(`CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      provider_session_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      cwd TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      project_id TEXT,
      task_id TEXT,
      assignment_id TEXT,
      capabilities TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  });

  test('DB failure on session list -> 500', async () => {
    await dbPool.query('DROP TABLE IF EXISTS agent_sessions CASCADE');
    const res = await fetch(`${BASE_DB}/v1/agents/sessions`);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.reason, 'DB_READ_FAILED');
    // restore
    await dbPool.query(`CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      provider_session_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      cwd TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      project_id TEXT,
      task_id TEXT,
      assignment_id TEXT,
      capabilities TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  });
});
