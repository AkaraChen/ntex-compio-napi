'use strict';
// ntex-on-compio (this project) side of the benchmark.
//
// Same three routes, same response bodies, same absence of middleware as the
// express baseline -- otherwise we would be measuring the demo's logging, not
// the HTTP path.
const { createApp } = require(process.env.ADDON || '/home/akrc/Developer/ntex-compio-napi');

const port = Number(process.env.PORT || 18811);
const workers = Number(process.env.WORKERS || 1);

// Keep admission control well clear of the load levels under test, so we
// measure the HTTP path rather than the new limiter. Recorded in the report.
const app = createApp({
  workers,
  maxInFlight: Number(process.env.MAX_IN_FLIGHT || 4096),
  maxQueued: Number(process.env.MAX_QUEUED || 4096),
  timeoutMs: 30000,
});

app.get('/hello', (req, res) => {
  res.send('Hello World');
});

app.get('/json', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(port, () => {
  console.log('READY ' + port);
});
