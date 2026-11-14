import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const FAKE_ADAPTER = path.resolve(ROOT, 'tests', 'fixtures', 'fake-paseo-adapter.mjs');

const PORT_FAKE = 39140;
const BASE_URL_FAKE = `http://127.0.0.1:${PORT_FAKE}`;

let fakeServer;
let fakeStdout = '';
let fakeStderr = '';
let createdSessionId = null;

async function startServer(port, envOverrides = {}) {
  const server = spawn(process.execPath, ['src/http/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: '', PORT: String(port), ...envOverrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  server.stdout.on('data', (d) => { stdout += d.toString(); });
  server.stderr.on('data', (d) => { stderr += d.toString(); });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) break;
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const health = await fetch(`${baseUrl}/api/health`).catch(() => null);
  if (!health || !health.ok) {
    try { server.kill(); } catch { /* ignore */ }
    throw new Error(`Server did not become ready on port ${port}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }
  return {
    server,
    baseUrl,
    get stdout() { return stdout; },
    get stderr() { return stderr; },
    stop: async () => {
      if (server && !server.killed) {
        server.kill();
        await new Promise((resolve) => {
          const timer = setTimeout(() => { try { server.kill('SIGKILL'); } catch { /* ignore */ } resolve(); }, 5_000);
          server.once('exit', () => { clearTimeout(timer); resolve(); });
        });
      }
    },
  };
}

before(async () => {
  fakeServer = await startServer(PORT_FAKE, {
    PASEO_ADAPTER_PATH: FAKE_ADAPTER,
    FAKE_PASEO_AVAILABLE: '1',
  });
});

after(async () => {
  if (fakeServer) await fakeServer.stop();
});

describe('Agent Session (fake adapter, deterministic)', () => {
  test('1. Create session -> 201 with real ID', async () => {
    const res = await fetch(`${BASE_URL_FAKE}/v1/agents/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'fake-provider', cwd: ROOT, title: 'Fake Session' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id, 'session id missing');
    assert.ok(body.sessionId, 'sessionId missing');
    assert.equal(body.provider, 'fake-provider');
    assert.equal(body.mock, false);
    createdSessionId = body.id;
  });

  test('2. List sessions -> returns tracked sessions', async () => {
    const res = await fetch(`${BASE_URL_FAKE}/v1/agents/sessions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.sessions));
    assert.ok(body.sessions.some((s) => s.id === createdSessionId || s.sessionId === createdSessionId), 'created session not in list');
  });

  test('3. Create session with missing provider -> 400', async () => {
    const res = await fetch(`${BASE_URL_FAKE}/v1/agents/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cwd: ROOT, title: 'No Provider' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.reason, 'MISSING_PROVIDER');
  });

  test('4. Create session when adapter unavailable -> 503', async () => {
    const srv = await startServer(39141, {
      PASEO_ADAPTER_PATH: FAKE_ADAPTER,
      FAKE_PASEO_AVAILABLE: '0',
    });
    try {
      const res = await fetch(`${srv.baseUrl}/v1/agents/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'fake-provider', title: 'Unavailable' }),
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.reason, 'PASEO_UNAVAILABLE');
    } finally {
      await srv.stop();
    }
  });

  test('5. Session status refresh -> returns updated status', async () => {
    const res = await fetch(`${BASE_URL_FAKE}/v1/agents/sessions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const session = body.sessions.find((s) => s.id === createdSessionId || s.sessionId === createdSessionId);
    assert.ok(session, 'tracked session missing');
    assert.equal(session.status, 'running');
  });
});

// Real Paseo smoke test (env-gated)
if (process.env.PASEO_DAEMON_URL) {
  describe('Agent Session (real Paseo smoke)', () => {
    let realServer;
    let realBaseUrl;
    before(async () => {
      realServer = await startServer(39142, {
        PASEO_ADAPTER_PATH: path.resolve(ROOT, 'src', 'runtime', 'paseo-adapter.mjs'),
        PASEO_DAEMON_URL: process.env.PASEO_DAEMON_URL,
        PASEO_PROVIDER: process.env.PASEO_PROVIDER || 'claude',
      });
      realBaseUrl = realServer.baseUrl;
    });
    after(async () => {
      if (realServer) await realServer.stop();
    });

    test('6. Start Paseo daemon, create session via API, verify real ID returned', async () => {
      const provider = process.env.PASEO_PROVIDER || 'claude';
      const res = await fetch(`${realBaseUrl}/v1/agents/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider, cwd: ROOT, title: 'Real Smoke Session' }),
      });
      // Accept 201 (success) — fail otherwise with body
      if (res.status !== 201) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`expected 201, got ${res.status}: ${JSON.stringify(body)}`);
      }
      const body = await res.json();
      assert.ok(body.id, 'real session id missing');
      assert.equal(body.mock, false);
      assert.equal(body.source, 'paseo');
    });
  });
} else {
  test('6. Real Paseo smoke (skipped: PASEO_DAEMON_URL not set)', { skip: true }, () => {});
}