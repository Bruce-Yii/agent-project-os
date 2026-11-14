import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDisposablePg } from '../../dist/src/persistence/disposable-pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 39123;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let pg;
let server;
let serverStdout = '';
let serverStderr = '';
let projectId;
let taskId;

async function waitForServer() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.mode === 'real' && json.db === 'connected') return json;
      }
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready.\nSTDOUT:\n${serverStdout}\nSTDERR:\n${serverStderr}`);
}

before(async () => {
  pg = await startDisposablePg();
  server = spawn(process.execPath, ['src/http/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: pg.connectionUri, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => { serverStdout += d.toString(); });
  server.stderr.on('data', (d) => { serverStderr += d.toString(); });
  await waitForServer();
});

after(async () => {
  if (server && !server.killed) {
    server.kill();
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try { server.kill('SIGKILL'); } catch { /* ignore */ }
        resolve();
      }, 5_000);
      server.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
  if (pg) {
    await pg.stop().catch(() => { /* ignore */ });
  }
});

describe('HTTP + PostgreSQL integration', () => {
  test('1. POST /v1/projects -> 201 with id, name, status', async () => {
    const res = await fetch(`${BASE_URL}/v1/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Integration Project', goal: 'g' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id, 'project id missing');
    assert.equal(body.name, 'Integration Project');
    assert.ok(body.status, 'project status missing');
    projectId = body.id;
  });

  test('2. GET /v1/projects -> list includes created project', async () => {
    const res = await fetch(`${BASE_URL}/v1/projects`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.projects));
    assert.ok(body.projects.some((p) => p.id === projectId), 'created project not in list');
  });

  test('3. GET /v1/projects/:id -> returns project', async () => {
    const res = await fetch(`${BASE_URL}/v1/projects/${projectId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, projectId);
  });

  test('4. POST /v1/tasks with valid projectId -> 201', async () => {
    const res = await fetch(`${BASE_URL}/v1/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId, title: 'Integration Task' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id, 'task id missing');
    taskId = body.id;
  });

  test('5. POST /v1/tasks with invalid projectId -> 404 PROJECT_NOT_FOUND', async () => {
    const res = await fetch(`${BASE_URL}/v1/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'does-not-exist', title: 'Bad Task' }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.reason, 'PROJECT_NOT_FOUND');
  });

  test('6. GET /v1/projects/:id/tasks -> returns tasks', async () => {
    const res = await fetch(`${BASE_URL}/v1/projects/${projectId}/tasks`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.tasks));
    assert.ok(body.tasks.some((t) => t.id === taskId), 'created task not in list');
  });

  test('7. POST /v1/commands with unknown intent -> 501 NOT_IMPLEMENTED', async () => {
    const res = await fetch(`${BASE_URL}/v1/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent: 'UnknownIntent', payload: {} }),
    });
    assert.equal(res.status, 501);
    const body = await res.json();
    assert.equal(body.status, 'NOT_IMPLEMENTED');
  });

  test('8. GET /v1/capabilities -> returns real/mock lists', async () => {
    const res = await fetch(`${BASE_URL}/v1/capabilities`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.real));
    assert.ok(Array.isArray(body.mock));
  });

  test('9. GET /api/health -> mode: real, db: connected', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.mode, 'real');
    assert.equal(body.db, 'connected');
  });
});
