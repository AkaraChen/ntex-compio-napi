'use strict';
const { createApp } = require('../..');
const { freePort, request, delay } = require('../helpers');
(async () => {
  const app = createApp({ timeoutMs: 250 });
  app.get('/slow', async (req, res) => { await delay(100); res.send('drained'); });
  app.get('/never', () => {});
  const port = freePort(18951);
  app.listen(port);
  await app.ready;
  const mode = process.argv[2] || 'drain';
  const response = request(port, mode === 'timeout' ? '/never' : '/slow');
  while (app.stats().inFlight === 0) await delay(5);
  let callback = false;
  const closed = app.close(() => { callback = true; });
  const result = await response;
  await closed;
  if (result.status !== (mode === 'timeout' ? 504 : 200)) throw new Error('active request did not drain');
  if (!callback || app.stats().inFlight !== 0) throw new Error('close callback or pending cleanup failed');
  console.log(`EXIT PROOF mode=${mode} status=${result.status} callback=${callback} stats=${JSON.stringify(app.stats())}`);
  // No process.exit(), forced termination, or unref'ed watchdog in this child.
})().catch(error => { console.error(error); process.exitCode = 1; });
