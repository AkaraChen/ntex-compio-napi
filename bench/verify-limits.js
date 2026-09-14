'use strict';
// Independent verification of the admission/body-limit work in 1860eb2.
//
// Deliberately NOT the repo's own test suite: my own client, my own assertions,
// my own ports.
//
// Two modes, run as two separate processes -- the native module keeps a single
// global server state and the JS facade allows only one listening app per
// Node environment, so the body-cap app and the admission app cannot coexist:
//
//   node verify-limits.js body
//   node verify-limits.js admission
const http = require('node:http');
const { createApp } = require(process.env.ADDON || '/home/akrc/Developer/ntex-compio-napi');

const mode = process.argv[2] || 'body';
const CAP = 1024;

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
}

function req({ port, method = 'GET', path = '/', body, headers = {} }) {
  return new Promise(resolve => {
    const r = http.request(
      { host: '127.0.0.1', port, method, path, headers, agent: false },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }
    );
    r.on('error', e => resolve({ status: 0, error: e.code || e.message }));
    if (body) r.write(body);
    r.end();
  });
}

function summary() {
  const failed = results.filter(r => !r.pass);
  console.log(`\n==== [${mode}] ${results.length - failed.length}/${results.length} checks passed ====`);
  process.exitCode = failed.length ? 1 : 0;
}

// ---------------------------------------------------------------- body mode
async function bodyMode() {
  const PORT = 18861;
  let dispatches = 0;

  const app = createApp({ maxBodyBytes: CAP, maxInFlight: 64, maxQueued: 0 });
  app.post('/echo', (req, res) => { dispatches++; res.json({ len: req.body.length }); });
  app.get('/ok', (req, res) => res.send('ok'));

  await new Promise((resolve, reject) => {
    app.listen(PORT, resolve);
    app.ready.catch(reject);
  });

  const over = await req({ port: PORT, method: 'POST', path: '/echo', body: 'x'.repeat(4096),
    headers: { 'content-length': '4096' } });
  check('oversized body -> 413', over.status === 413, `status=${over.status}`);
  check('oversized body never dispatched to JS', dispatches === 0, `dispatches=${dispatches}`);

  const at = await req({ port: PORT, method: 'POST', path: '/echo', body: 'y'.repeat(CAP),
    headers: { 'content-length': String(CAP) } });
  check('body exactly at cap -> 200', at.status === 200, `status=${at.status} body=${at.body}`);

  const oneOver = await req({ port: PORT, method: 'POST', path: '/echo', body: 'z'.repeat(CAP + 1),
    headers: { 'content-length': String(CAP + 1) } });
  check('body cap+1 -> 413', oneOver.status === 413, `status=${oneOver.status}`);

  const after = await req({ port: PORT, path: '/ok' });
  check('normal request after 413 -> 200', after.status === 200 && after.body === 'ok',
    `status=${after.status} body=${after.body}`);

  // chunked, no Content-Length: exceed the cap mid-stream
  const chunked = await new Promise(resolve => {
    const r = http.request({ host: '127.0.0.1', port: PORT, method: 'POST', path: '/echo',
      headers: { 'transfer-encoding': 'chunked' }, agent: false }, res => {
      let d = ''; res.on('data', c => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, error: e.code }));
    for (let i = 0; i < 8; i++) r.write('w'.repeat(400));
    r.end();
  });
  check('chunked body over cap -> 413', chunked.status === 413,
    `status=${chunked.status} ${chunked.error || ''}`);

  const s = app.stats();
  console.log('\nstats =', JSON.stringify(s));
  check('stats.maxBodyBytes reflects config', s.maxBodyBytes === CAP, `maxBodyBytes=${s.maxBodyBytes}`);
  check('stats.rejected413 counted', s.rejected413 >= 3, `rejected413=${s.rejected413}`);
  check('stats.runtime=compio', s.runtime === 'compio', `runtime=${s.runtime}`);
  check('stats.workers>0 (server really started)', s.workers > 0, `workers=${s.workers}`);

  await app.close();
}

// ----------------------------------------------------------- admission mode
async function admissionMode() {
  const PORT = 18862;
  let slowDispatches = 0;

  const app = createApp({ maxInFlight: 2, maxQueued: 0 });
  app.get('/slow', async (req, res) => {
    slowDispatches++;
    await new Promise(r => setTimeout(r, 600));
    res.send('slow-done');
  });
  app.get('/fast', (req, res) => res.send('fast'));

  await new Promise((resolve, reject) => {
    app.listen(PORT, resolve);
    app.ready.catch(reject);
  });

  const burst = await Promise.all(
    Array.from({ length: 8 }, () => req({ port: PORT, path: '/slow' }))
  );
  const rejected = burst.filter(r => r.status === 503);
  check('over-capacity -> 503', rejected.length >= 5, `statuses=[${burst.map(r => r.status).join(',')}]`);
  check('503 carries Retry-After',
    rejected.length > 0 && rejected.every(r => r.headers['retry-after']),
    `retry-after=${rejected[0] && rejected[0].headers['retry-after']}`);
  check('no more than maxInFlight reached JS', slowDispatches <= 2, `slowDispatches=${slowDispatches}`);

  await new Promise(r => setTimeout(r, 1000));
  const rec = await req({ port: PORT, path: '/fast' });
  check('slots released after burst -> 200', rec.status === 200 && rec.body === 'fast',
    `status=${rec.status} body=${rec.body}`);

  const s = app.stats();
  console.log('\nstats =', JSON.stringify(s));
  check('stats.rejected503 counted', s.rejected503 >= 5, `rejected503=${s.rejected503}`);
  check('stats.peakInFlight <= maxInFlight', s.peakInFlight <= s.maxInFlight,
    `peak=${s.peakInFlight} max=${s.maxInFlight}`);
  check('stats.peakInFlight actually engaged', s.peakInFlight >= 2, `peak=${s.peakInFlight}`);
  check('stats.inFlight drained to 0', s.inFlight === 0, `inFlight=${s.inFlight}`);
  check('stats.maxInFlight reflects config', s.maxInFlight === 2, `maxInFlight=${s.maxInFlight}`);

  await app.close();
}

(mode === 'body' ? bodyMode() : admissionMode())
  .then(summary)
  .catch(e => { console.error('FATAL', e); process.exitCode = 2; });
