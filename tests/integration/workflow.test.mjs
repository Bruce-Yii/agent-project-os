import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDisposablePg } from '../../dist/src/persistence/disposable-pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 39124;
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
    } catch {
      // not ready
    }
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
      const timer = setTimeout(() => { try { server.kill('SIGKILL'); } catch { /* ignore */ } resolve(); }, 5_000);
      server.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
  if (pg) await pg.stop().catch(() => { /* ignore */ });
});

describe('Workflow P2 vertical slice + negatives', () => {
  let projectId;
  let taskId;
  let assignmentId;
  let runId;
  let reviewId;

  test('vertical slice: CreateTask -> CreateAssignment -> StartRun -> CompleteRun -> SubmitArtifact -> SubmitReview -> AcceptReview', async () => {
    const p = await cmd('CreateProject', { name: 'Workflow Project' });
    assert.equal(p.status, 200);
    assert.equal(p.body.status, 'OK');
    projectId = p.body.projectId;
    assert.ok(projectId);

    const t = await cmd('CreateTask', { projectId, title: 'Workflow Task' });
    assert.equal(t.status, 200);
    assert.equal(t.body.status, 'OK');
    taskId = t.body.taskId;
    assert.ok(taskId);

    const a = await cmd('CreateAssignment', { taskId, agentId: 'agent-1' });
    assert.equal(a.status, 200);
    assert.equal(a.body.status, 'OK');
    assignmentId = a.body.assignmentId;
    assert.ok(assignmentId);

    const r = await cmd('StartRun', { assignmentId });
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'OK');
    runId = r.body.runId;
    assert.ok(runId);
    assert.equal(r.body.attempt, 1);

    // complete first run before starting another (max one non-terminal run)
    const cr0 = await cmd('CompleteRun', { runId, status: 'succeeded' });
    assert.equal(cr0.body.status, 'OK');

    // second run increments attempt
    const r2 = await cmd('StartRun', { assignmentId });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.status, 'OK');
    assert.equal(r2.body.attempt, 2);
    runId = r2.body.runId;

    const cr = await cmd('CompleteRun', { runId, status: 'succeeded' });
    assert.equal(cr.status, 200);
    assert.equal(cr.body.status, 'OK');
    assert.equal(cr.body.runStatus, 'succeeded');

    const art = await cmd('SubmitArtifact', { runId, kind: 'pr', immutableRef: 'https://example.com/pr/1' });
    assert.equal(art.status, 200);
    assert.equal(art.body.status, 'OK');
    assert.ok(art.body.artifactId);

    const rev = await cmd('SubmitReview', { taskId, runId, verdict: 'pending', evidenceRefs: 'ref1' });
    assert.equal(rev.status, 200);
    assert.equal(rev.body.status, 'OK');
    reviewId = rev.body.reviewId;
    assert.ok(reviewId);

    const acc = await cmd('AcceptReview', { reviewId });
    assert.equal(acc.status, 200);
    assert.equal(acc.body.status, 'OK');
  });

  test('negative: invalid references', async () => {
    const t = await cmd('CreateTask', { projectId: 'does-not-exist', title: 'Bad' });
    assert.equal(t.body.status, 'REJECTED');
    assert.equal(t.body.reason, 'NOT_FOUND');

    const a = await cmd('CreateAssignment', { taskId: 'does-not-exist', agentId: 'agent-1' });
    assert.equal(a.body.status, 'REJECTED');
    assert.equal(a.body.reason, 'TASK_NOT_FOUND');

    const r = await cmd('StartRun', { assignmentId: 'does-not-exist' });
    assert.equal(r.body.status, 'REJECTED');
    assert.equal(r.body.reason, 'ASSIGNMENT_NOT_FOUND');

    const c = await cmd('CompleteRun', { runId: 'does-not-exist', status: 'succeeded' });
    assert.equal(c.body.status, 'REJECTED');
    assert.equal(c.body.reason, 'RUN_NOT_FOUND');

    const art = await cmd('SubmitArtifact', { runId: 'does-not-exist', kind: 'pr', immutableRef: 'ref' });
    assert.equal(art.body.status, 'REJECTED');
    assert.equal(art.body.reason, 'RUN_NOT_FOUND');
  });

  test('negative: task/run mismatch', async () => {
    // create another task in same project
    const t2 = await cmd('CreateTask', { projectId, title: 'Task 2' });
    assert.equal(t2.body.status, 'OK');
    const task2Id = t2.body.taskId;
    // runId belongs to task1; submit review for task2 with runId -> mismatch
    const rev = await cmd('SubmitReview', { taskId: task2Id, runId, verdict: 'pending' });
    assert.equal(rev.body.status, 'REJECTED');
    assert.equal(rev.body.reason, 'RUN_TASK_MISMATCH');
  });

  test('negative: unsupported status/verdict', async () => {
    // new assignment/run for status test
    const a = await cmd('CreateAssignment', { taskId, agentId: 'agent-2' });
    const rid = (await cmd('StartRun', { assignmentId: a.body.assignmentId })).body.runId;
    const badStatus = await cmd('CompleteRun', { runId: rid, status: 'bogus' });
    assert.equal(badStatus.body.status, 'REJECTED');
    assert.equal(badStatus.body.reason, 'INVALID_TRANSITION');

    const badVerdict = await cmd('SubmitReview', { taskId, verdict: 'bogus' });
    assert.equal(badVerdict.body.status, 'REJECTED');
    assert.equal(badVerdict.body.reason, 'INVALID_VERDICT');
  });

  test('negative: invalid transitions', async () => {
    // AcceptReview on already accepted review -> invalid
    const acc2 = await cmd('AcceptReview', { reviewId });
    assert.equal(acc2.body.status, 'REJECTED');
    assert.equal(acc2.body.reason, 'INVALID_TRANSITION');

    // CompleteRun from succeeded -> failed invalid
    const a = await cmd('CreateAssignment', { taskId, agentId: 'agent-3' });
    const rid = (await cmd('StartRun', { assignmentId: a.body.assignmentId })).body.runId;
    await cmd('CompleteRun', { runId: rid, status: 'succeeded' });
    const bad = await cmd('CompleteRun', { runId: rid, status: 'failed' });
    assert.equal(bad.body.status, 'REJECTED');
    assert.equal(bad.body.reason, 'INVALID_TRANSITION');
  });

  test('CompleteAssignment/CancelAssignment/TransitionRunState', async () => {
    const p = await cmd('CreateProject', { name: 'CA Project' });
    assert.equal(p.body.status, 'OK');
    const t = await cmd('CreateTask', { projectId: p.body.projectId, title: 'CA Task' });
    assert.equal(t.body.status, 'OK');
    const a = await cmd('CreateAssignment', { taskId: t.body.taskId, agentId: 'agent-x' });
    assert.equal(a.body.status, 'OK');
    const assignmentId = a.body.assignmentId;

    const run = await cmd('StartRun', { assignmentId });
    assert.equal(run.body.status, 'OK');
    const rid = run.body.runId;

    const tr = await cmd('TransitionRunState', { runId: rid, toStatus: 'succeeded' });
    assert.equal(tr.status, 200);
    assert.equal(tr.body.status, 'OK');
    assert.equal(tr.body.to, 'succeeded');

    const ca = await cmd('CompleteAssignment', { assignmentId });
    assert.equal(ca.status, 200);
    assert.equal(ca.body.status, 'OK');

    // cancelling a completed assignment is invalid
    const canc = await cmd('CancelAssignment', { assignmentId });
    assert.equal(canc.body.status, 'REJECTED');
    assert.equal(canc.body.reason, 'INVALID_TRANSITION');
  });

  test('CancelAssignment on pending assignment', async () => {
    const p = await cmd('CreateProject', { name: 'Cancel Project' });
    const t = await cmd('CreateTask', { projectId: p.body.projectId, title: 'Cancel Task' });
    const a = await cmd('CreateAssignment', { taskId: t.body.taskId, agentId: 'agent-y' });
    const canc = await cmd('CancelAssignment', { assignmentId: a.body.assignmentId });
    assert.equal(canc.status, 200);
    assert.equal(canc.body.status, 'OK');
  });

  test('negative: active run prevents concurrent StartRun', async () => {
    const p = await cmd('CreateProject', { name: 'Concurrent Project' });
    const t = await cmd('CreateTask', { projectId: p.body.projectId, title: 'Concurrent Task' });
    const a = await cmd('CreateAssignment', { taskId: t.body.taskId, agentId: 'agent-z' });
    const r1 = await cmd('StartRun', { assignmentId: a.body.assignmentId });
    assert.equal(r1.body.status, 'OK');
    const r2 = await cmd('StartRun', { assignmentId: a.body.assignmentId });
    assert.equal(r2.body.status, 'REJECTED');
    assert.equal(r2.body.reason, 'ACTIVE_RUN_EXISTS');
  });

  test('negative: duplicate/replayed command', async () => {
    const env = { idempotencyKey: 'dup-workflow-1' };
    const r1 = await cmd('CreateProject', { name: 'Dup Workflow' }, env);
    assert.equal(r1.body.status, 'OK');
    const pid = r1.body.projectId;
    const r2 = await cmd('CreateProject', { name: 'Dup Workflow' }, env);
    assert.equal(r2.body.status, 'OK');
    assert.equal(r2.body.projectId, pid);
  });
});