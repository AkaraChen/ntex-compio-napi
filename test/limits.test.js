'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { createApp } = require('..');
const native = require('../index.node');
const { freePort, request, delay } = require('./helpers');

async function until(predicate, label, ms = 2000) {
  const deadline = Date.now() + ms;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, `waiting for ${label}`);
    await delay(5);
  }
}
function stats(app = native) {
  const s = app.stats();
  assert.ok(s.peakInFlight <= s.maxInFlight, JSON.stringify(s));
  assert.ok(s.inFlight <= s.maxInFlight, JSON.stringify(s));
  assert.ok(s.queued <= s.maxQueued, JSON.stringify(s));
  return s;
}
async function listen(t, app, hint = 19001) {
  const port = freePort(hint);
  app.listen(port); await app.ready;
  t.after(() => app.close());
  return port;
}
// Send headers or incomplete chunks and deliberately never finish the upload.
// A response proves refusal without waiting for EOF or draining the body.
function unfinished(port, headers, chunks = []) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/', method: 'POST', headers, agent: false }, res => {
      const parts = [];
      res.on('data', part => parts.push(part));
      res.on('error', reject);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(parts).toString() });
        req.destroy();
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('unfinished upload did not get a response')));
    req.flushHeaders();
    (async () => {
      for (const chunk of chunks) {
        if (req.destroyed) break;
        req.write(chunk);
        await delay(10); // Separate network writes; cross the cap after earlier bytes arrived.
      }
    })().catch(reject);
  });
}
function abandoned(t, port, path, extra = '') {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  socket.on('connect', () => socket.write(`GET ${path} HTTP/1.1\r\nHost: localhost\r\n${extra}\r\n`));
  t.after(() => socket.destroy());
  return socket;
}

test('limit validation and configured defaults', { timeout: 10000 }, async t => {
  for (const [name, min, max] of [['maxBodyBytes', 1, 1073741824], ['maxInFlight', 1, 1000000], ['maxQueued', 0, 1000000]]) {
    for (const value of [min - 1, max + 1, 1.5, NaN, Infinity, -Infinity]) {
      assert.throws(() => native.start({ host: '127.0.0.1', port: 19001, [name]: value }, () => {}),
        { name: 'RangeError', message: `${name} must be an integer in ${min}..${max}` });
    }
  }
  const app = createApp(); await listen(t, app);
  const s = stats(app);
  assert.equal(s.maxBodyBytes, 1048576); assert.equal(s.maxInFlight, 1024); assert.equal(s.maxQueued, 0);
  console.log('DEFAULT LIMITS', JSON.stringify(s));
  await app.close();
  const upper = createApp({ maxBodyBytes: 1073741824, maxInFlight: 1000000, maxQueued: 1000000 });
  await listen(t, upper);
  assert.equal(stats(upper).maxBodyBytes, 1073741824);
  assert.equal(stats(upper).maxInFlight, 1000000); assert.equal(stats(upper).maxQueued, 1000000);
});

test('413: Content-Length precheck, exact cap, cap+1, incomplete chunked upload, fresh connections', { timeout: 10000 }, async t => {
  let dispatched = 0;
  const port = freePort(19002);
  await native.start({ host: '127.0.0.1', port, maxBodyBytes: 16, maxInFlight: 1 }, (id, req) => {
    dispatched++; native.respond(id, 200, {}, req.body);
  });
  t.after(() => native.stop());
  for (const result of [
    await unfinished(port, { 'Content-Length': 17 }),
    await unfinished(port, { 'Transfer-Encoding': 'chunked' }, [Buffer.alloc(8), Buffer.alloc(8), Buffer.alloc(1)]),
  ]) {
    assert.equal(result.status, 413); assert.equal(result.headers.connection, 'close');
    assert.match(result.text, /16/);
  }
  assert.equal(dispatched, 0, 'native dispatch never called for either refusal');
  for (const headers of [{ 'Content-Length': 16 }, { 'Transfer-Encoding': 'chunked' }]) {
    const body = Buffer.alloc(16, 171);
    const r = await request(port, '/', { method: 'POST', headers, body });
    assert.equal(r.status, 200); assert.deepEqual(r.body, body);
  }
  assert.equal((await request(port, '/', { method: 'POST', body: Buffer.alloc(17) })).status, 413);
  assert.equal(dispatched, 2);
  assert.equal((await request(port, '/')).status, 200);
  assert.equal(dispatched, 3); assert.equal(stats().rejected413, 3); assert.equal(stats().inFlight, 0);
  console.log('BODY CAP dispatch=3 (accepted only)', JSON.stringify(stats()));
});

test('64 KiB cap: concurrent oversized uploads and measured RSS', { timeout: 15000 }, async t => {
  let dispatched = 0;
  const app = createApp({ maxBodyBytes: 65536, maxInFlight: 32, workers: 2 });
  app.use((req, res) => { dispatched++; res.send('healthy'); });
  const port = await listen(t, app, 19003);
  const before = process.memoryUsage().rss;
  const results = await Promise.all(Array.from({ length: 32 }, () => unfinished(port,
    { 'Transfer-Encoding': 'chunked' }, [Buffer.alloc(32768), Buffer.alloc(32768), Buffer.alloc(1)])));
  const after = process.memoryUsage().rss;
  for (const r of results) assert.equal(r.status, 413);
  assert.equal(dispatched, 0); assert.equal(stats(app).rejected413, 32);
  assert.equal((await request(port, '/')).text, 'healthy');
  assert.equal(stats(app).inFlight, 0);
  console.log(`OVERSIZED N=32 cap=65536 RSS_before_bytes=${before} RSS_after_bytes=${after} RSS_delta_bytes=${after - before}`);
  console.log('OVERSIZED STATS', JSON.stringify(stats(app)));
});

for (const workers of [1, 2]) {
  test(`admission workers=${workers}: 4 dispatched, 8 refused, gate release`, { timeout: 10000 }, async t => {
    const app = createApp({ workers, maxInFlight: 4, maxQueued: 0 });
    let reached = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    t.after(() => release());
    app.get('/', async (req, res) => { reached++; await gate; res.send('done'); });
    const port = await listen(t, app, 19010 + workers);
    const refused = [];
    const all = Promise.all(Array.from({ length: 12 }, () => request(port, '/').then(r => {
      if (r.status === 503) refused.push(r); return r;
    })));
    await until(() => refused.length === 8 && reached === 4, 'exact admission split');
    for (const r of refused) { assert.equal(r.headers['retry-after'], '1'); assert.match(r.text, /capacity/); }
    assert.equal(stats(app).inFlight, 4); assert.equal(stats(app).peakInFlight, 4);
    console.log(`ADMISSION SATURATED workers=${workers}`, JSON.stringify(stats(app)));
    release();
    const results = await all;
    assert.equal(results.filter(r => r.status === 200).length, 4);
    assert.equal(reached, 4); assert.equal(stats(app).inFlight, 0); assert.equal(stats(app).rejected503, 8);
    console.log(`ADMISSION workers=${workers} dispatch=${reached}`, JSON.stringify(stats(app)));
  });
}

test('bounded queue, queued disconnect, FIFO transfer and recovery', { timeout: 10000 }, async t => {
  const app = createApp({ workers: 2, maxInFlight: 1, maxQueued: 2 });
  const reached = [], replies = [];
  app.get('/:id', (req, res) => { reached.push(req.params.id); replies.push(res); });
  const port = await listen(t, app, 19020);
  const first = request(port, '/first');
  await until(() => reached.length === 1, 'first dispatch');
  const gone = abandoned(t, port, '/gone');
  await until(() => stats(app).queued === 1, 'queued disconnect request');
  const second = request(port, '/second');
  await until(() => stats(app).queued === 2, 'full queue');
  assert.equal((await request(port, '/overflow')).status, 503);
  assert.deepEqual(reached, ['first']);
  console.log('QUEUE SATURATED', JSON.stringify(stats(app)));
  gone.destroy();
  await until(() => stats(app).queued === 1, 'queued disconnect removed');
  const third = request(port, '/third');
  await until(() => stats(app).queued === 2, 'replacement queued');
  replies[0].send('first'); assert.equal((await first).status, 200);
  await until(() => reached.length === 2, 'second dispatch');
  assert.deepEqual(reached, ['first', 'second']);
  replies[1].send('second'); assert.equal((await second).status, 200);
  await until(() => reached.length === 3, 'third dispatch');
  replies[2].send('third'); assert.equal((await third).status, 200);
  assert.deepEqual(reached, ['first', 'second', 'third']);
  assert.equal(stats(app).inFlight, 0); assert.equal(stats(app).queued, 0);
  console.log('QUEUE FIFO + queued disconnect', JSON.stringify(stats(app)));
});

test('slot release: timeout, late reply, active disconnect and upload disconnect', { timeout: 12000 }, async t => {
  const app = createApp({ maxInFlight: 1, timeoutMs: 5000 });
  let late, reached = 0;
  app.get('/never', (req, res) => { reached++; late = res; });
  app.get('/ok', (req, res) => res.send('healthy'));
  const port = await listen(t, app, 19021);
  const socket = abandoned(t, port, '/never');
  await until(() => reached === 1, 'active dispatch');
  socket.destroy();
  await until(() => stats(app).inFlight === 0, 'disconnect release before 5s timeout');
  late.send('stale');
  assert.equal((await request(port, '/ok')).status, 200);
  assert.equal(stats(app).timedOut, 0);
  const uploading = abandoned(t, port, '/never', 'Content-Length: 8\r\n');
  await until(() => stats(app).inFlight === 1, 'upload reservation');
  uploading.destroy();
  await until(() => stats(app).inFlight === 0, 'upload disconnect release');
  assert.equal((await request(port, '/ok')).status, 200);
  assert.equal(reached, 1);
  console.log('DISCONNECT active + upload, no timeout', JSON.stringify(stats(app)));
  await app.close();
  const timeoutApp = createApp({ maxInFlight: 1, timeoutMs: 150 });
  timeoutApp.get('/never', (req, res) => { late = res; });
  timeoutApp.get('/ok', (req, res) => res.send('healthy'));
  const timeoutPort = await listen(t, timeoutApp, 19021);
  assert.equal((await request(timeoutPort, '/never')).status, 504);
  assert.equal(stats(timeoutApp).inFlight, 0);
  late.send('late');
  assert.equal((await request(timeoutPort, '/ok')).status, 200);
  assert.equal(stats(timeoutApp).timedOut, 1);
  console.log('TIMEOUT slot recovered', JSON.stringify(stats(timeoutApp)));
});

test('native dispatch throw and shutdown release active and queued slots', { timeout: 12000 }, async t => {
  const port = freePort(19022);
  await native.start({ host: '127.0.0.1', port, maxInFlight: 1, maxQueued: 1, timeoutMs: 150 }, (id, req) => {
    if (req.url === '/throw') throw new Error('dispatch failure');
    if (req.url === '/ok') native.respond(id, 200, {}, 'ok');
  });
  t.after(() => native.stop());
  assert.equal((await request(port, '/throw')).status, 500);
  assert.equal(stats().inFlight, 0);
  assert.equal((await request(port, '/ok')).status, 200);
  const first = request(port, '/never');
  await until(() => stats().inFlight === 1, 'shutdown active');
  const second = request(port, '/queued');
  await until(() => stats().queued === 1, 'shutdown queued');
  const stopped = native.stop();
  assert.equal((await first).status, 504); assert.equal((await second).status, 504);
  await stopped;
  assert.equal(stats().inFlight, 0); assert.equal(stats().queued, 0);
  console.log('THROW + graceful shutdown', JSON.stringify(stats()));
});

test('admission happens before upload; header cap takes precedence; queued timeout transfer', { timeout: 10000 }, async t => {
  const app = createApp({ maxInFlight: 1, maxQueued: 1, maxBodyBytes: 16, timeoutMs: 5000 });
  let reached = 0;
  app.use((req, res) => { reached++; res.send('ok'); });
  const port = await listen(t, app, 19023);
  const upload = abandoned(t, port, '/', 'Content-Length: 16\r\n');
  await until(() => stats(app).inFlight === 1, 'reserved upload');
  const queued = request(port, '/');
  await until(() => stats(app).queued === 1, 'queued behind upload');
  assert.equal((await unfinished(port, { 'Content-Length': 16 })).status, 503);
  assert.equal((await unfinished(port, { 'Content-Length': 17 })).status, 413);
  assert.equal(reached, 0);
  upload.destroy();
  assert.equal((await queued).status, 200);
  assert.equal(stats(app).inFlight, 0);
  console.log('PRE-UPLOAD ADMISSION + 413 precedence', JSON.stringify(stats(app)));
  await app.close();
  const timeoutApp = createApp({ maxInFlight: 1, maxQueued: 1, timeoutMs: 150 });
  timeoutApp.get('/never', () => {});
  timeoutApp.get('/ok', (req, res) => res.send('ok'));
  const p = await listen(t, timeoutApp, 19023);
  const first = request(p, '/never');
  await until(() => stats(timeoutApp).inFlight === 1, 'timeout active');
  const second = request(p, '/ok');
  await until(() => stats(timeoutApp).queued === 1, 'timeout queued');
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map(r => r.status), [504, 200]);
  assert.equal(stats(timeoutApp).inFlight, 0); assert.equal(stats(timeoutApp).queued, 0);
  console.log('TIMEOUT transfers queued slot', JSON.stringify(stats(timeoutApp)));
});

test('shutdown budget cancels a stalled upload and queued request, closes sockets, permits restart', { timeout: 10000 }, async t => {
  const app = createApp({ maxInFlight: 1, maxQueued: 1, timeoutMs: 50 });
  let reached = 0;
  app.use((req, res) => { reached++; res.send('ok'); });
  const port = await listen(t, app, 19024);
  const upload = abandoned(t, port, '/', 'Content-Length: 8\r\n');
  let uploadClosed = false, queueClosed = false;
  upload.on('close', () => { uploadClosed = true; });
  await until(() => stats(app).inFlight === 1, 'stalled upload reserved');
  const queued = abandoned(t, port, '/');
  queued.on('close', () => { queueClosed = true; });
  await until(() => stats(app).queued === 1, 'stalled queue');
  await app.close();
  await until(() => uploadClosed && queueClosed, 'both sockets closed');
  assert.equal(reached, 0); assert.equal(stats(app).inFlight, 0); assert.equal(stats(app).queued, 0);
  console.log('FORCED SHUTDOWN socketsClosed=2 dispatch=0', JSON.stringify(stats(app)));
  const restarted = createApp({ maxInFlight: 1 });
  restarted.get('/', (req, res) => res.send('restarted'));
  const p = await listen(t, restarted, 19024);
  assert.equal((await request(p, '/')).text, 'restarted');
  assert.equal(stats(restarted).inFlight, 0);
});

test('busy JS: expired requests never dispatch, capacity recovers across repeated timeouts', { timeout: 10000 }, async t => {
  const { Worker } = require('node:worker_threads');
  const app = createApp({ maxInFlight: 1, timeoutMs: 25 });
  let dispatched = 0;
  app.use((req, res) => { dispatched++; res.send('healthy'); });
  const port = await listen(t, app, 19026);
  const sync = new Int32Array(new SharedArrayBuffer(12));
  const worker = new Worker(require.resolve('./fixtures/stalled-js-client.js'), { workerData: { port, sync: sync.buffer } });
  const exited = new Promise((resolve, reject) => { worker.on('exit', resolve); worker.on('error', reject); });
  t.after(() => worker.terminate());
  // Intentionally block only the test's JS thread. The native compio workers and
  // the real HTTP client in a separate Node worker must keep making progress.
  assert.equal(Atomics.wait(sync, 0, 0, 5000), 'ok');
  assert.equal(Atomics.load(sync, 2), 0); assert.equal(Atomics.load(sync, 1), 12);
  assert.equal(await exited, 0);
  assert.equal(dispatched, 0); assert.equal(stats(app).timedOut, 12); assert.equal(stats(app).inFlight, 0);
  assert.equal((await request(port, '/')).text, 'healthy');
  assert.equal(dispatched, 1); assert.equal(stats(app).peakInFlight, 1);
  console.log('BUSY JS expiredDispatch=0 recoveredDispatch=1', JSON.stringify(stats(app)));
});
