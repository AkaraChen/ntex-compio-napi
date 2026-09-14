// Elysia on Bun -- the "modern fast" JS option.
// Same three routes, no plugins, no lifecycle hooks: we are measuring the
// request path, not the feature surface.
import { Elysia } from 'elysia';

const port = Number(Bun.env.PORT || 18905);

new Elysia()
  .get('/hello', () => 'Hello World')
  .get('/json', () => ({ message: 'Hello World' }))
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .listen({ port, hostname: '127.0.0.1' }, () => {
    console.log('READY ' + port);
  });
