import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDisposablePg } from '../../dist/src/persistence/disposable-pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 39125;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let pg;
let server;
let serverStdout = '';
let serverStderr = '';

async function waitForServer() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.mode === 'real' && json.db === 'connected') return json;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready.\nSTDOUT:\n${serverStdout}\nSTDERR:\n${serverStderr}`);
}

async function cmd(intent, payload = {}, envelope = {}) {
  const res = await fetch(`${BASE_URL}/v1/commands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ intent, payload, envelope }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
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
      const timer = setTimeout(() => { try { server.kill('SIGKILL'); } catch {} resolve(); }, 5_000);
      server.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
  if (pg) await pg.stop().catch(() => {});
});

describe('Workflow retry semantics', () => {
  async function setupAssignment() {
    const p = await cmd('CreateProject', { name: 'Retry Project' });
    const t = await cmd('CreateTask', { projectId: p.body.projectId, title: 'Retry Task' });
    const a = await cmd('CreateAssignment', { taskId: t.body.taskId, agentId: 'agent-1' });
    return a.body.assignmentId;
  }

  test('Run retry: failed -> new attempt', async () => {
    const assignmentId = await setupAssignment();
    const r1 = await cmd('StartRun', { assignmentId });
    assert.equal(r1.body.status, 'OK');
    const runId = r1.body.runId;
    const cr = await cmd('CompleteRun', { runId, status: 'failed' });
    assert.equal(cr.body.status, 'OK');
    const r2 = await cmd('StartRun', { assignmentId });
    assert.equal(r2.body.status, 'OK');
    assert.equal(r2.body.attempt, 2);
  });

  test('Run retry: interrupted -> new attempt', async () => {
    const assignmentId = await setupAssignment();
    const r1 = await cmd('StartRun', { assignmentId });
    assert.equal(r1.body.status, 'OK');
    const runId = r1.body.runId;
    const cr = await cmd('CompleteRun', { runId, status: 'interrupted' });
    assert.equal(cr.body.status, 'OK');
    const r2 = await cmd('StartRun', { assignmentId });
    assert.equal(r2.body.status, 'OK');
    assert.equal(r2.body.attempt, 2);
  });

  test('Concurrent StartRun -> exactly one succeeds', async () => {
    const assignmentId = await setupAssignment();
    const [r1, r2] = await Promise.all([
      cmd('StartRun', { assignmentId }),
      cmd('StartRun', { assignmentId }),
    ]);
    const statuses = [r1.body.status, r2.body.status];
    const okCount = statuses.filter((s) => s === 'OK').length;
    const rejected = [r1, r2].filter((r) => r.body.status === 'REJECTED');
    assert.equal(okCount, 1, `expected exactly one OK, got ${okCount}`);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].body.reason, 'ACTIVE_RUN_EXISTS');
  });

  test('Assignment complete while run running -> rejected', async () => {
    const assignmentId = await setupAssignment();
    const r = await cmd('StartRun', { assignmentId });
    assert.equal(r.body.status, 'OK');
    const ca = await cmd('CompleteAssignment', { assignmentId });
    assert.equal(ca.body.status, 'REJECTED');
    assert.equal(ca.body.reason, 'ACTIVE_RUN_EXISTS');
  });

  test('Assignment cancel while run running -> rejected', async () => {
    const assignmentId = await setupAssignment();
    const r = await cmd('StartRun', { assignmentId });
    assert.equal(r.body.status, 'OK');
    const canc = await cmd('CancelAssignment', { assignmentId });
    assert.equal(canc.body.status, 'REJECTED');
    assert.equal(canc.body.reason, 'ACTIVE_RUN_EXISTS');
  });
});
