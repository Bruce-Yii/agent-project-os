// WP1-C: Minimal 1.0 Web/API shell — Fastify 5 + in-memory mock storage
// HONEST MOCK BOUNDARY: This uses in-memory storage, not PostgreSQL.
// Real DB integration requires WP1-A Gate 0 PASS + WP1-A Module Acceptance.
// Labeled as DEMO/Mock where applicable. Nothing here is claimed as real integration.

import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

const fastify = Fastify({ logger: true });

// In-memory stores (MOCK — not persisted, lost on restart)
const projects = new Map();
const tasks = new Map();
const runs = new Map();
const reviews = new Map();

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', service: 'agent-project-os', version: '0.0.0-dev', mode: 'mock-in-memory' };
});

// Capabilities: what is real vs mock
fastify.get('/v1/capabilities', async () => {
  return {
    service: 'agent-project-os',
    version: '0.0.0-dev',
    mode: 'mock-in-memory',
    real: [
      'health check',
      'projects: create/read/list (in-memory, non-persistent)',
      'tasks: create/read/list (in-memory, validates projectId exists)',
      'reviews: list pending (in-memory)',
      'project current-state read (in-memory stub)',
    ],
    mock: [
      'persistence (no PostgreSQL; in-memory only)',
      'POST /v1/commands (not implemented -> 501 NOT_IMPLEMENTED)',
      'agent sessions / providers / runs / assignments / artifacts / approvals',
      'current-state writes',
      'events / cursors / SSE / WebSocket',
    ],
    requires: [
      'WP1-A Gate 0 PASS for persistence + domain code',
      'WP1-B Module Acceptance for provider/session/runtime',
      'WP1-C module contract v0.1 for assignment/run/review/approval',
    ],
  };
});

// Projects
fastify.get('/v1/projects', async () => {
  return { projects: Array.from(projects.values()) };
});

fastify.get('/v1/projects/:id', async (request, reply) => {
  const project = projects.get(request.params.id);
  if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
  return project;
});

fastify.post('/v1/projects', async (request, reply) => {
  const { name, goal } = request.body || {};
  if (!isNonEmptyString(name)) return reply.status(400).send({ reason: 'MISSING_NAME', message: 'name is required and must be a non-empty string' });
  const id = `proj-${randomUUID()}`;
  const project = { id, name: name.trim(), goal: goal || '', status: 'draft', createdAt: new Date().toISOString(), version: 1 };
  projects.set(id, project);
  return reply.status(201).send(project);
});

fastify.get('/v1/projects/:id/tasks', async (request) => {
  const projectId = request.params.id;
  return { tasks: Array.from(tasks.values()).filter(t => t.projectId === projectId) };
});

fastify.get('/v1/projects/:id/current-state', async (request, reply) => {
  const project = projects.get(request.params.id);
  if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
  return { projectId: project.id, currentState: project.currentState || null, version: project.version };
});

// Tasks
fastify.post('/v1/tasks', async (request, reply) => {
  const { projectId, title, scope, acceptanceCriteria } = request.body || {};
  if (!isNonEmptyString(projectId)) return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'projectId is required' });
  if (!isNonEmptyString(title)) return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'title is required and must be a non-empty string' });
  if (!projects.has(projectId)) return reply.status(404).send({ reason: 'PROJECT_NOT_FOUND', message: `project ${projectId} does not exist` });
  const id = `task-${randomUUID()}`;
  const task = { id, projectId, title: title.trim(), scope: scope || '', acceptanceCriteria: acceptanceCriteria || '', status: 'backlog', version: 1, createdAt: new Date().toISOString() };
  tasks.set(id, task);
  return reply.status(201).send(task);
});

// Commands: NOT IMPLEMENTED (honest 501)
fastify.post('/v1/commands', async (request, reply) => {
  const { intent, payload, envelope } = request.body || {};
  if (!intent) return reply.status(400).send({ reason: 'MISSING_FIELDS', message: 'intent is required' });
  // No command intents are implemented in this mock shell.
  return reply.status(501).send({
    status: 'NOT_IMPLEMENTED',
    intent,
    mode: 'mock-in-memory',
    message: 'Command execution is not implemented in WP1-C mock shell. Real command execution requires WP1-A Gate 0 PASS + WP1-A Module Acceptance + WP1-C module contract v0.1.',
  });
});

// Reviews
fastify.get('/v1/reviews/pending', async () => {
  return { reviews: Array.from(reviews.values()).filter(r => r.status === 'pending') };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '127.0.0.1' });
    console.log('WP1-C 1.0 shell running at http://127.0.0.1:3000');
    console.log('Mode: mock-in-memory (in-memory storage, not persisted)');
    console.log('Real DB integration requires WP1-A Gate 0 PASS');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();