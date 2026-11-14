// SSE lifecycle adapter for the Paseo runtime.
// Subscriptions are established before history is fetched. Live events are buffered
// during backfill and reconciled against Paseo's epoch/sequence cursor to close the gap.
function cursorOf(value, fallbackEpoch = null) {
  if (!value || typeof value !== 'object') return null;
  const nested = value.cursor || (value.payload && value.payload.cursor) || null;
  const epoch = value.epoch || (value.payload && value.payload.epoch) || (nested && nested.epoch) || fallbackEpoch;
  const rawSeq = value.seq ?? (value.payload && value.payload.seq) ?? (nested && nested.seq);
  const seq = Number(rawSeq);
  if (typeof epoch !== 'string' || !Number.isSafeInteger(seq) || seq < 0) return null;
  return { epoch, seq };
}

function eventKey(value, fallbackEpoch = null) {
  const cursor = cursorOf(value, fallbackEpoch);
  if (cursor) return `cursor:${cursor.epoch}:${cursor.seq}`;
  const id = value && (value.id || (value.payload && value.payload.id));
  return typeof id === 'string' && id.length ? `id:${id}` : null;
}

function disposeOnce(map, resource, dispose) {
  if (!resource || (typeof resource !== 'object' && typeof resource !== 'function')) return Promise.resolve();
  if (map.has(resource)) return map.get(resource);
  const result = Promise.resolve().then(dispose);
  map.set(resource, result);
  return result;
}

export async function streamAgentEvents({ request, reply, connect, sessionId }) {
  reply.hijack();
  const res = reply.raw;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let closed = false;
  let adapter = null;
  let subscription = null;
  let cleanupQueue = Promise.resolve();
  let resolveClosed;
  const closedPromise = new Promise((resolve) => { resolveClosed = resolve; });
  const adapterDisposals = new WeakMap();
  const subscriptionDisposals = new WeakMap();

  const send = (event) => {
    if (closed || res.destroyed || res.writableEnded) return false;
    try {
      return res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      return false;
    }
  };

  const disposeAdapter = (value) => disposeOnce(
    adapterDisposals,
    value,
    () => typeof value.disconnect === 'function' ? value.disconnect() : undefined,
  );
  const disposeSubscription = (value) => disposeOnce(
    subscriptionDisposals,
    value,
    () => {
      if (typeof value.release === 'function') return value.release();
      if (typeof value === 'function') return value();
      if (typeof value.unsubscribe === 'function') return value.unsubscribe();
      return undefined;
    },
  );

  const close = () => {
    if (!closed) {
      closed = true;
      resolveClosed();
    }
    const currentSubscription = subscription;
    const currentAdapter = adapter;
    subscription = null;
    adapter = null;
    cleanupQueue = cleanupQueue.then(async () => {
      if (currentSubscription) await disposeSubscription(currentSubscription);
      if (currentAdapter) await disposeAdapter(currentAdapter);
    }).catch(() => {});
    if (!res.writableEnded && !res.destroyed) {
      try { res.end(); } catch { /* socket already closed */ }
    }
    return cleanupQueue;
  };

  const onDisconnect = () => { void close(); };
  res.once('close', onDisconnect);
  request.raw.once('aborted', onDisconnect);

  const raceWithClose = async (promise) => Promise.race([
    Promise.resolve(promise).then((value) => ({ value })),
    closedPromise.then(() => ({ closed: true })),
  ]);

  try {
    const connectPromise = Promise.resolve().then(() => connect());
    connectPromise.then((lateAdapter) => {
      if (closed && lateAdapter) return disposeAdapter(lateAdapter);
      return undefined;
    }).catch(() => {});
    const connected = await raceWithClose(connectPromise);
    if (connected.closed) return;
    adapter = connected.value;
    if (!adapter) {
      send({ type: 'error', reason: 'PASEO_UNAVAILABLE' });
      await close();
      return;
    }

    if (typeof adapter.subscribeEvents !== 'function') throw new Error('PASEO_SUBSCRIBE_UNAVAILABLE');
    if (typeof adapter.fetchTimeline !== 'function') throw new Error('PASEO_TIMELINE_UNAVAILABLE');

    const buffered = [];
    const seen = new Set();
    let backfillComplete = false;
    let backfillEpoch = null;
    let backfillEnd = null;
    const deliverLive = (event) => {
      const cursor = cursorOf(event, backfillEpoch);
      if (cursor && backfillEnd && cursor.epoch === backfillEnd.epoch && cursor.seq <= backfillEnd.seq) return;
      const key = eventKey(event, backfillEpoch);
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      send(event);
    };
    const onLive = (event) => {
      if (closed) return;
      if (!backfillComplete) buffered.push(event);
      else deliverLive(event);
    };

    const subscriptionPromise = Promise.resolve().then(() => adapter.subscribeEvents(sessionId, onLive));
    subscriptionPromise.then((lateSubscription) => {
      if (closed && lateSubscription) return disposeSubscription(lateSubscription);
      return undefined;
    }).catch(() => {});
    const subscribed = await raceWithClose(subscriptionPromise);
    if (subscribed.closed) return;
    subscription = subscribed.value;
    if (!subscription) throw new Error('PASEO_SUBSCRIPTION_NOT_CREATED');

    if (subscription.ready) {
      const ready = await raceWithClose(subscription.ready);
      if (ready.closed) return;
    }

    const timelinePromise = Promise.resolve().then(() => adapter.fetchTimeline(sessionId, request.query || {}));
    const fetched = await raceWithClose(timelinePromise);
    if (fetched.closed) return;
    const timeline = fetched.value || {};
    backfillEpoch = timeline.epoch || (timeline.endCursor && timeline.endCursor.epoch) || null;
    backfillEnd = timeline.endCursor || null;

    if (timeline.gap) {
      send({
        type: 'timeline_gap',
        epoch: backfillEpoch,
        startCursor: timeline.startCursor || null,
        endCursor: backfillEnd,
      });
    }
    for (const entry of timeline.entries || []) {
      if (closed) return;
      const key = eventKey(entry, backfillEpoch);
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      send(entry);
    }

    // Events received after subscribe-ready but before the history snapshot are
    // either already represented by endCursor or are newer and must be delivered.
    for (const event of buffered) {
      if (closed) return;
      deliverLive(event);
    }
    buffered.length = 0;
    backfillComplete = true;
  } catch (error) {
    if (!closed) {
      send({ type: 'error', reason: 'PASEO_SSE_FAILED', message: error && error.message ? error.message : String(error) });
      await close();
    }
  }
}
