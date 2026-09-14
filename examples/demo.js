'use strict';
const { createApp } = require('..');
const app = createApp();
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  res.set('x-powered-by', 'ntex-compio-neon');
  next();
});
app.get('/hello', (req, res) => res.send('Hello World'));
app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
app.post('/echo', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 10));
  res.json({ got: req.body.toString() });
});
app.get('/optional/:name?', (req, res) => res.json({ name: req.params.name || 'world' }));
app.get('/files/*', (req, res) => res.send(req.params[0] || ''));
app.get('/fail', async () => { throw new Error('demo failure'); });
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
app.listen(Number(process.env.PORT || 18731), () => console.log('READY: listening on ' + (process.env.PORT || 18731)));
app.ready.catch(error => { console.error(error); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  await app.close();
  console.log('CLOSED', app.stats());
});
