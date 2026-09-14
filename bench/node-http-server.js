'use strict';
// Bare Node http.createServer -- no framework at all.
//
// This is the reference point that separates two very different costs:
//   * how much the RUNTIME can push, and
//   * how much the FRAMEWORK on top of it costs.
// Without it, "fastify is 2x express" says nothing about whether either is
// near the runtime's own ceiling.
const http = require('node:http');

const port = Number(process.env.PORT || 18901);

const server = http.createServer((req, res) => {
  const url = req.url;
  const q = url.indexOf('?');
  const path = q === -1 ? url : url.slice(0, q);

  if (path === '/hello') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': 11 });
    res.end('Hello World');
  } else if (path === '/json') {
    const body = '{"message":"Hello World"}';
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
    });
    res.end(body);
  } else if (path.startsWith('/users/')) {
    const body = JSON.stringify({ id: path.slice('/users/'.length) });
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
    });
    res.end(body);
  } else {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
// the whole point of an extreme sweep is to hold a LOT of sockets open
server.maxRequestsPerSocket = 0;
server.listen(port, '127.0.0.1', () => console.log('READY ' + port));
