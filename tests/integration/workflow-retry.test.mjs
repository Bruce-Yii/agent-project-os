import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDisposablePg } from '../../dist/src/persistence/disposable-pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 39125;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let pg;
let observerPool;
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
  observerPool = new Pool({ connectionString: pg.connectionUri });
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
  if (observerPool) await observerPool.end().catch(() => {});
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
  test('StartRun vs CompleteAssignment: StartRun lock wins', async () => {
    await assertCrossCommandRace('StartRun', 'CompleteAssignment', 'active', ['running']);
  });

  test('StartRun vs CancelAssignment: StartRun lock wins', async () => {
    await assertCrossCommandRace('StartRun', 'CancelAssignment', 'active', ['running']);
  });

  test('StartRun vs CompleteAssignment: CompleteAssignment lock wins', async () => {
    await assertCrossCommandRace('CompleteAssignment', 'StartRun', 'completed', []);
  });

  test('StartRun vs CancelAssignment: CancelAssignment lock wins', async () => {
    await assertCrossCommandRace('CancelAssignment', 'StartRun', 'cancelled', []);
  });
});

async function waitForLockWait(expected) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const { rows } = await observerPool.query(
      `SELECT COUNT(*)::int AS count
       FROM pg_stat_activity
       WHERE datname=current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type='Lock'
         AND query ILIKE '%for update%'`,
    );
    if (rows[0].count >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Expected ${expected} workflow commands waiting on the Assignment row lock`);
}

async function assertCrossCommandRace(firstIntent, secondIntent, expectedAssignmentStatus, expectedRunStatuses) {
  const p = await cmd('CreateProject', { name: 'Cross Command Race' });
  const t = await cmd('CreateTask', { projectId: p.body.projectId, title: 'Race Task' });
  const a = await cmd('CreateAssignment', { taskId: t.body.taskId, agentId: 'agent-race' });
  const assignmentId = a.body.assignmentId;

  const lockClient = await observerPool.connect();
  let transactionOpen = false;
  try {
    await lockClient.query('BEGIN');
    transactionOpen = true;
    await lockClient.query('SELECT id FROM assignments WHERE id=$1 FOR UPDATE', [assignmentId]);

    const firstPromise = cmd(firstIntent, { assignmentId });
    await waitForLockWait(1);
    const secondPromise = cmd(secondIntent, { assignmentId });
    await waitForLockWait(2);

    await lockClient.query('COMMIT');
    transactionOpen = false;
    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    assert.equal(first.body.status, 'OK', `${firstIntent} should win the queued lock order: ${JSON.stringify(first.body)}`);
    assert.equal(second.body.status, 'REJECTED', `${secondIntent} should observe the committed state: ${JSON.stringify(second.body)}`);

    const final = await observerPool.query(
      `SELECT a.status,
              COALESCE(array_agg(r.status) FILTER (WHERE r.id IS NOT NULL), ARRAY[]::text[]) AS run_statuses
       FROM assignments a
       LEFT JOIN runs r ON r.assignment_id=a.id
       WHERE a.id=$1
       GROUP BY a.id`,
      [assignmentId],
    );
    assert.equal(final.rows.length, 1);
    assert.equal(final.rows[0].status, expectedAssignmentStatus);
    assert.deepEqual(final.rows[0].run_statuses.sort(), [...expectedRunStatuses].sort());
    assert.equal(
      ['completed', 'cancelled'].includes(final.rows[0].status) &&
        final.rows[0].run_statuses.some((status) => status === 'queued' || status === 'running'),
      false,
      'completed/cancelled Assignment must never retain an active Run',
    );
  } finally {
    if (transactionOpen) await lockClient.query('ROLLBACK').catch(() => {});
    lockClient.release();
  }
}

