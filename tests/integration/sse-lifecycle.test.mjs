import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { streamAgentEvents } from '../../src/http/sse-stream.mjs';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function harness() {
  const request = { params: { id: 'session-1' }, query: {}, raw: new EventEmitter() };
  const response = new EventEmitter();
  response.writableEnded = false;
  response.destroyed = false;
  response.chunks = [];
  response.writeHead = (status, headers) => { response.statusCode = status; response.headers = headers; };
  response.write = (chunk) => { response.chunks.push(chunk); return true; };
  response.end = () => {
    if (!response.writableEnded) {
      response.writableEnded = true;
      response.emit('close');
    }
  };
  const reply = { raw: response, hijack() {} };
  return { request, response, reply };
}

function eventsFrom(response) {
  return response.chunks.flatMap((chunk) => String(chunk).split('\n\n'))
    .map((block) => block.split('\n').find((line) => line.startsWith('data:')))
    .filter(Boolean)
    .map((line) => JSON.parse(line.slice(5).trim()));
}

async function waitFor(predicate, message) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail(message || 'condition was not reached before timeout');
}

test('SSE releases an adapter that resolves after client disconnect during connect', async () => {
  const h = harness();
  const pending = deferred();
  let disconnects = 0;
  const adapter = { async disconnect() { disconnects += 1; } };
  const running = streamAgentEvents({ request: h.request, reply: h.reply, connect: () => pending.promise, sessionId: 'session-1' });
  await Promise.resolve();
  h.request.raw.emit('aborted');
  await running;
  pending.resolve(adapter);
  await waitFor(() => disconnects === 1, 'late adapter was not disconnected');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(disconnects, 1);
});

test('SSE releases subscription and adapter when client disconnects during pending backfill', async () => {
  const h = harness();
  const pendingTimeline = deferred();
  let disconnects = 0;
  let unsubscribes = 0;
  const adapter = {
    async disconnect() { disconnects += 1; },
    subscribeEvents() { const unsub = () => { unsubscribes += 1; }; unsub.ready = Promise.resolve(); return unsub; },
    fetchTimeline() { adapter.fetchStarted = true; return pendingTimeline.promise; },
  };
  const running = streamAgentEvents({ request: h.request, reply: h.reply, connect: async () => adapter, sessionId: 'session-1' });
  await waitFor(() => adapter.fetchStarted === true, 'fetchTimeline was not called');
  h.request.raw.emit('aborted');
  await running;
  pendingTimeline.resolve({ entries: [], epoch: 'epoch-1', endCursor: { epoch: 'epoch-1', seq: 0 } });
  await waitFor(() => disconnects === 1 && unsubscribes === 1, 'resources were not released');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(disconnects, 1);
  assert.equal(unsubscribes, 1);
});

test('SSE releases a subscription that resolves after disconnect during subscribe', async () => {
  const h = harness();
  const pendingSubscription = deferred();
  let disconnects = 0;
  let unsubscribes = 0;
  const adapter = {
    async disconnect() { disconnects += 1; },
    subscribeEvents() { adapter.subscribeStarted = true; return pendingSubscription.promise; },
    async fetchTimeline() { return { entries: [], epoch: 'epoch-1', endCursor: { epoch: 'epoch-1', seq: 0 } }; },
  };
  const running = streamAgentEvents({ request: h.request, reply: h.reply, connect: async () => adapter, sessionId: 'session-1' });
  await waitFor(() => adapter.subscribeStarted, 'subscribeEvents was not called');
  h.request.raw.emit('aborted');
  await running;
  const lateUnsub = () => { unsubscribes += 1; };
  pendingSubscription.resolve(lateUnsub);
  await waitFor(() => disconnects === 1 && unsubscribes === 1, 'late subscription was not released');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(disconnects, 1);
  assert.equal(unsubscribes, 1);
});

test('SSE subscribes before backfill and deduplicates events at the cursor boundary', async () => {
  const h = harness();
  let live;
  let disconnects = 0;
  let unsubscribes = 0;
  const adapter = {
    async disconnect() { disconnects += 1; },
    subscribeEvents(_id, callback) {
      live = callback;
      callback({ type: 'live-event', id: 'newer', seq: 2, epoch: 'epoch-1' });
      callback({ type: 'duplicate-live', id: 'duplicate', seq: 1, epoch: 'epoch-1' });
      const unsub = () => { unsubscribes += 1; };
      unsub.ready = Promise.resolve();
      return unsub;
    },
    async fetchTimeline() {
      return {
        entries: [{ type: 'history', id: 'history-1', seq: 1 }],
        epoch: 'epoch-1',
        endCursor: { epoch: 'epoch-1', seq: 1 },
      };
    },
  };
  await streamAgentEvents({ request: h.request, reply: h.reply, connect: async () => adapter, sessionId: 'session-1' });
  const delivered = eventsFrom(h.response);
  assert.equal(delivered.filter((event) => event.type === 'history').length, 1);
  assert.equal(delivered.filter((event) => event.type === 'live-event' && event.seq === 2).length, 1);
  assert.equal(delivered.some((event) => event.type === 'duplicate-live'), false);

  live({ type: 'live-event', id: 'newest', seq: 3, epoch: 'epoch-1' });
  assert.equal(eventsFrom(h.response).filter((event) => event.seq === 3).length, 1);
  h.response.emit('close');
  await waitFor(() => disconnects === 1 && unsubscribes === 1, 'close did not release resources');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(disconnects, 1);
  assert.equal(unsubscribes, 1);
});
