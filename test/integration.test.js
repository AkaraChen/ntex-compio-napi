'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { createApp } = require('..');
const native = require('../index.node');
const { freePort, request, delay } = require('./helpers');

async function listening(t, app, hint) {
  const port = freePort(hint);
  let callback = false;
  assert.equal(app.listen(port, () => { callback = true; }), app);
  await app.ready;
  assert.equal(callback, true);
  t.after(() => app.close());
  return port;
}

test('Express-shaped API over real HTTP sockets', { timeout: 15000 }, async t => {
  assert.deepEqual(Object.keys(native).sort(), ['respond', 'start', 'stats', 'stop']);
  const app = createApp();
  app.use((req, res, next) => { req.steps = ['global']; res.set('x-middleware', 'yes'); next(); });
  app.use('/api', async (req, res, next) => { await delay(1); req.steps.push('prefix'); next(); });
  app.get('/api/users/:id/:detail?', (req, res, next) => { req.steps.push('route'); next(); }, (req, res) => res.json({
    method: req.method, path: req.path, url: req.url, originalUrl: req.originalUrl,
    query: req.query, params: req.params, header: req.get('X-TEST'), ip: req.ip,
    buffer: Buffer.isBuffer(req.body), steps: req.steps,
  }));
  app.get('/apiary', (req, res) => res.json(req.steps));
  app.get('/optional/:id?', (req, res) => res.json(req.params));
  app.get('/files/*', (req, res) => res.send(req.params[0]));
  app.get('/', (req, res) => res.send('root'));
  app.head('/method', (req, res) => res.set('x-method', req.method).end('head'));
  for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options']) {
    app[method]('/method', (req, res) => res.set('x-method', req.method).send(req.body.length ? req.body : req.method));
  }
  app.all('/all', (req, res) => res.send(req.method));
  app.get('/headers', (req, res) => {
    res.status(201).set({ 'X-One': 1, 'X-Many': ['a', 'b'] }).type('text');
    assert.equal(res.get('X-ONE'), '1');
    res.send('Grüße 🌍');
  });
  app.get('/json', (req, res) => res.json({ snow: '雪' }));
  app.get('/object', (req, res) => res.send({ object: true }));
  app.get('/buffer', (req, res) => res.send(Buffer.from([0, 255, 128, 10])));
  app.get('/empty', (req, res) => res.end());
  app.get('/end', (req, res) => res.end('end'));
  app.get('/redirect', (req, res) => res.redirect('/hello'));
  app.get('/redirect307', (req, res) => res.redirect(307, '/hello'));
  app.get('/status', (req, res) => res.sendStatus(418));
  app.get('/nobody', (req, res) => res.sendStatus(204));
  app.get('/once', (req, res) => { res.send('first'); res.send('second'); });
  const port = await listening(t, app, 18901);
  const get = path => request(port, path);
  const details = JSON.parse((await request(port, '/api/users/a%20b/history?q=one&q=two&__proto__=safe', { headers: { 'X-Test': 'value' } })).text);
  assert.deepEqual(details, {
    method: 'GET', path: '/api/users/a%20b/history', url: '/api/users/a%20b/history?q=one&q=two&__proto__=safe',
    originalUrl: '/api/users/a%20b/history?q=one&q=two&__proto__=safe',
    query: { q: ['one', 'two'], ['__proto__']: 'safe' }, params: { id: 'a b', detail: 'history' },
    header: 'value', ip: '127.0.0.1', buffer: true, steps: ['global', 'prefix', 'route'],
  });
  assert.deepEqual(JSON.parse((await get('/apiary')).text), ['global']);
  assert.deepEqual(JSON.parse((await get('/optional')).text), {});
  assert.deepEqual(JSON.parse((await get('/optional/42/')).text), { id: '42' });
  assert.equal((await get('/files/a/b.txt')).text, 'a/b.txt');
  assert.equal((await get('/files')).text, '');
  assert.equal((await get('/')).text, 'root');
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
    const r = await request(port, '/method', { method });
    assert.equal(r.status, 200); assert.equal(r.headers['x-method'], method);
    assert.equal(r.text, method === 'HEAD' ? '' : method);
    assert.equal((await request(port, '/all', { method })).text, method === 'HEAD' ? '' : method);
  }
  const text = await get('/headers');
  assert.equal(text.status, 201); assert.equal(text.text, 'Grüße 🌍');
  assert.equal(text.headers['content-type'], 'text/plain; charset=utf-8');
  assert.equal(Number(text.headers['content-length']), Buffer.byteLength(text.text));
  assert.equal(text.headers['x-one'], '1'); assert.equal(text.headers['x-many'], 'a, b');
  const json = await get('/json');
  assert.equal(json.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(Number(json.headers['content-length']), Buffer.byteLength(json.text));
  assert.deepEqual(JSON.parse((await get('/object')).text), { object: true });
  const binary = await get('/buffer');
  assert.deepEqual(binary.body, Buffer.from([0, 255, 128, 10]));
  assert.equal(binary.headers['content-type'], 'application/octet-stream');
  const head = await request(port, '/headers', { method: 'HEAD' });
  assert.equal(head.text, ''); assert.equal(head.headers['content-length'], text.headers['content-length']);
  assert.equal((await get('/empty')).text, ''); assert.equal((await get('/end')).text, 'end');
  for (const [path, code] of [['/redirect', 302], ['/redirect307', 307]]) {
    const r = await get(path); assert.equal(r.status, code); assert.equal(r.headers.location, '/hello');
  }
  assert.equal((await get('/status')).text, require('node:http').STATUS_CODES[418]);
  const empty = await get('/nobody'); assert.equal(empty.status, 204); assert.equal(empty.text, '');
  assert.equal((await get('/once')).text, 'first');
  const missing = await get('/missing'); assert.equal(missing.status, 404); assert.match(missing.text, /Cannot GET/);
  assert.equal(app.stats().inFlight, 0);
});

test('throws, rejections, next(err), error middleware and defaults', { timeout: 15000 }, async t => {
  const app = createApp({ timeoutMs: 1000 });
  app.get('/sync', () => { throw new Error('sync'); });
  app.get('/async', async () => { await delay(5); throw new Error('async'); });
  app.get('/next', (req, res, next) => next(new Error('next')));
  app.get('/throw-null', () => { throw null; });
  app.get('/reject-undefined', async () => { throw undefined; });
  app.get('/cyclic', (req, res) => { const obj = {}; obj.obj = obj; res.json(obj); });
  app.get('/badheader', (req, res) => res.set('x-test', 'bad\r\nvalue').send('no'));
  app.get('/handled', async () => { throw new Error('handled'); });
  app.get('/rethrow', () => { throw new Error('original'); });
  app.use('/handled', async (err, req, res, next) => { await delay(1); res.status(500).json({ error: err.message }); });
  app.use('/rethrow', async (err, req, res, next) => { throw new Error('error-handler failure'); });
  const port = await listening(t, app, 18902);
  for (const path of ['/sync', '/async', '/next', '/cyclic', '/badheader', '/rethrow', '/throw-null', '/reject-undefined']) {
    const r = await request(port, path); assert.equal(r.status, 500); assert.equal(r.text, 'Internal Server Error');
  }
  assert.deepEqual(JSON.parse((await request(port, '/handled')).text), { error: 'handled' });
  assert.equal(app.stats().timedOut, 0); assert.equal(app.stats().inFlight, 0);
  console.log('ASSERT sync/async exceptions and next(err) -> 500, no timeout or hang');
});

for (const workers of [1, 2, 4]) {
  test(`compio workers=${workers}: 80 concurrent distinct binary requests`, { timeout: 15000 }, async t => {
    const app = createApp({ workers, timeoutMs: 4000 });
    let arrived = 0;
    let release;
    const barrier = new Promise(resolve => { release = resolve; });
    app.post('/echo/:id', async (req, res) => {
      arrived++;
      if (arrived === 80) release();
      await barrier; // Every request must reach JS before any receives a reply.
      await delay((79 - Number(req.params.id)) % 17);
      res.set('x-id', req.params.id).send(req.body);
    });
    const port = await listening(t, app, 18910 + workers);
    const payloads = Array.from({ length: 80 }, (_, i) => Buffer.concat([Buffer.from(`request=${i};`), Buffer.alloc(2048 + i, i), Buffer.from([0, 255, 128])]));
    const results = await Promise.all(payloads.map((body, i) => request(port, `/echo/${i}`, { method: 'POST', body })));
    results.forEach((r, i) => { assert.equal(r.status, 200); assert.equal(r.headers['x-id'], String(i)); assert.deepEqual(r.body, payloads[i]); });
    assert.deepEqual(app.stats(), { runtime: 'compio', requests: 80, workers, inFlight: 0, timedOut: 0 });
    console.log(`ASSERT workers=${workers}: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies`);
    console.log('stats()', app.stats());
  });
}

test('never responding times out; late responses cannot consume a later request', { timeout: 10000 }, async t => {
  const app = createApp({ timeoutMs: 150 });
  let late;
  app.get('/never', () => {});
  app.get('/late', (req, res) => { late = res; });
  app.get('/ok', (req, res) => res.send('still alive'));
  const port = await listening(t, app, 18921);
  for (const path of ['/never', '/late']) {
    const before = Date.now();
    const response = await request(port, path);
    assert.equal(response.status, 504); assert.ok(Date.now() - before < 3000);
    assert.equal(app.stats().inFlight, 0);
  }
  late.send('too late');
  assert.equal((await request(port, '/ok')).text, 'still alive');
  assert.equal(app.stats().timedOut, 2);
  console.log('ASSERT unanswered handlers -> 504; late reply ignored; next request succeeds;', app.stats());
});

test('native validation, dispatch exceptions, duplicate response, bind failure and restart', { timeout: 15000 }, async () => {
  assert.throws(() => native.start({ host: '127.0.0.1', port: -1 }, () => {}), /port/);
  assert.throws(() => native.start({ host: '127.0.0.1', port: 18930, workers: 0 }, () => {}), /workers/);
  assert.throws(() => native.start({ host: '127.0.0.1', port: 18930, timeoutMs: NaN }, () => {}), /timeoutMs/);
  const port = freePort(18930);
  let oldId;
  await native.start({ host: '127.0.0.1', port }, (id, req) => {
    oldId = id;
    if (req.url === '/throw') throw new Error('native callback throws');
    assert.throws(() => native.respond(id, 99, {}, ''), /status/);
    assert.throws(() => native.respond(id, 200, { bad: 'x\r\ny' }, ''), /header/);
    assert.equal(native.respond(id, 200, [['x-native', 'yes']], 'native'), true);
    assert.equal(native.respond(id, 200, {}, 'duplicate'), false);
  });
  try {
    assert.throws(() => native.start({ host: '127.0.0.1', port }, () => {}), /already running/);
    const r = await request(port, '/'); assert.equal(r.text, 'native'); assert.equal(r.headers['x-native'], 'yes');
    assert.equal((await request(port, '/throw')).status, 500);
  } finally { await native.stop(); }
  await native.stop();
  // Own the conflicting listener: never interfere with unrelated services.
  const net = require('node:net');
  const occupied = net.createServer();
  const occupiedPort = freePort(18931);
  await new Promise(resolve => occupied.listen(occupiedPort, '127.0.0.1', resolve));
  try {
    require('node:child_process').execFileSync('ss', ['-H', '-ltn']);
    console.log(`ss checked: intentionally testing our occupied port ${occupiedPort}`);
    await assert.rejects(native.start({ host: '127.0.0.1', port: occupiedPort }, () => {}), /Address already in use/);
  } finally { await new Promise(resolve => occupied.close(resolve)); }
  const restartPort = freePort(port);
  await native.start({ host: '127.0.0.1', port: restartPort }, (id) => {
    assert.equal(native.respond(oldId, 200, {}, 'stale'), false);
    native.respond(id, 200, {}, 'restarted');
  });
  try { assert.equal((await request(restartPort, '/')).text, 'restarted'); }
  finally { await native.stop(); }
  console.log('ASSERT startup failure rejects and releases roots/channel; restart succeeds; stale IDs rejected');
});

test('app.close drains active requests and Node exits without process.exit', { timeout: 20000 }, async () => {
  for (const mode of ['drain', 'timeout']) {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, ['test/fixtures/exit.js', mode], { cwd: process.cwd(), timeout: 7000 });
    assert.equal(stderr, ''); assert.match(stdout, /EXIT PROOF/);
    console.log(stdout.trim());
    console.log(`ASSERT process-exit ${mode}: child exit code 0, no signal, within 7s watchdog`);
  }
});
