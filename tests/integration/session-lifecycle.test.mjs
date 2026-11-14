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
    assert.ok(events.some((e) => e.type === 'history' || e.type === 'live-event'), 'expected backfill or live event');
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
