'use strict';
// Fastify baseline. Same routes, no middleware, logging off -- a per-request
// logger would dominate the measurement exactly like express's would.
const Fastify = require('fastify');

const port = Number(process.env.PORT || 18902);

const app = Fastify({
  logger: false,
  disableRequestLogging: true,
  // the extreme sweep intentionally holds many sockets open
  keepAliveTimeout: 65000,
  connectionTimeout: 0,
});

app.get('/hello', (req, reply) => {
  reply.send('Hello World');
});

app.get('/json', (req, reply) => {
  reply.send({ message: 'Hello World' });
});

app.get('/users/:id', (req, reply) => {
  reply.send({ id: req.params.id });
});

app.listen({ port, host: '127.0.0.1' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('READY ' + port);
});
