// Bare Bun.serve -- the Bun runtime's own ceiling, no framework.
// The counterpart to node-http-server.js: it tells us how much of Elysia's
// number is Elysia and how much is just Bun.
const port = Number(Bun.env.PORT || 18904);

Bun.serve({
  port,
  hostname: '127.0.0.1',
  reusePort: false,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === '/hello') {
      return new Response('Hello World', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
    if (path === '/json') {
      return new Response(JSON.stringify({ message: 'Hello World' }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    if (path.startsWith('/users/')) {
      return new Response(JSON.stringify({ id: path.slice('/users/'.length) }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
});

console.log('READY ' + port);
