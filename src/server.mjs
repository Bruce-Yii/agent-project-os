// WP1-C: Minimal 1.0 Web/API shell — Fastify 5 + in-memory mock storage
// HONEST MOCK BOUNDARY: This uses in-memory storage, not PostgreSQL.
// Real DB integration requires WP1-A Gate 0 PASS + WP1-A Module Acceptance.
// Labeled as DEMO/Mock where applicable.

import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// In-memory stores (MOCK — not persisted)
const projects = new Map();
const tasks = new Map();
const runs = new Map();
const reviews = new Map();

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', service: 'agent-project-os', version: '0.0.0-dev', mode: 'mock' };
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
  if (!name) return reply.status(400).send({ reason: 'MISSING_NAME' });
  const id = `proj-${Date.now()}`;
  const project = { id, name, goal: goal || '', status: 'draft', createdAt: new Date().toISOString(), version: 1 };
  projects.set(id, project);
  return reply.status(201).send(project);
});

// Tasks
fastify.get('/v1/projects/:id/tasks', async (request) => {
  const projectId = request.params.id;
  return { tasks: Array.from(tasks.values()).filter(t => t.projectId === projectId) };
});

fastify.post('/v1/tasks', async (request, reply) => {
  const { projectId, title, scope, acceptanceCriteria } = request.body || {};
  if (!projectId || !title) return reply.status(400).send({ reason: 'MISSING_FIELDS' });
  const id = `task-${Date.now()}`;
  const task = { id, projectId, title, scope: scope || '', acceptanceCriteria: acceptanceCriteria || '', status: 'backlog', version: 1, createdAt: new Date().toISOString() };
  tasks.set(id, task);
  return reply.status(201).send(task);
});

// Commands (mock)
fastify.post('/v1/commands', async (request, reply) => {
  const { intent, payload, envelope } = request.body || {};
  if (!intent || !envelope) return reply.status(400).send({ reason: 'MISSING_FIELDS' });
  // Mock command execution — real implementation requires WP1-A domain code
  return reply.status(200).send({
    status: 'OK',
    intent,
    mode: 'MOCK',
    message: 'This is a mock response. Real command execution requires WP1-A Gate 0 PASS.',
    receivedAt: new Date().toISOString(),
  });
});

// Current State
fastify.get('/v1/projects/:id/current-state', async (request, reply) => {
  const project = projects.get(request.params.id);
  if (!project) return reply.status(404).send({ reason: 'NOT_FOUND' });
  return { projectId: project.id, currentState: project.currentState || null, version: project.version };
});

// Reviews
fastify.get('/v1/reviews/pending', async () => {
  return { reviews: Array.from(reviews.values()).filter(r => r.status === 'pending') };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('WP1-C 1.0 shell running at http://localhost:3000');
    console.log('Mode: MOCK (in-memory storage, not persisted)');
    console.log('Real DB integration requires WP1-A Gate 0 PASS');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
