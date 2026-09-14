'use strict';
// Express baseline for the benchmark.
//
// Deliberately minimal: NO middleware, NO logger. A console.log per request
// would dominate the measurement and tell us nothing about the HTTP stack.
//
// ETAG=0 disables express's default ETag generation, so we can separate
// "cost of the HTTP engine" from "cost of express's default header work".
const express = require('express');

const port = Number(process.env.PORT || 18801);
const app = express();

if (process.env.ETAG === '0') app.disable('etag');
if (process.env.XPB === '0') app.disable('x-powered-by');

app.get('/hello', (req, res) => {
  res.send('Hello World');
});

app.get('/json', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log('READY ' + port);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
