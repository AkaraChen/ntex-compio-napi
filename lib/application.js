'use strict';
const { EventEmitter } = require('node:events');
const native = require('../index.node');
const { compile, dispatch } = require('./router');
const { createRequest } = require('./request');
const { createResponse } = require('./response');
let listeningApp;
function createApp(options = {}) {
  const app = new EventEmitter();
  const stack = [];
  let closing;
  for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'all']) {
    app[method] = (path, ...handlers) => {
      add(path, handlers, method.toUpperCase());
      return app;
    };
  }
  function add(path, handlers, method) {
    if (!handlers.length || handlers.some(fn => typeof fn !== 'function')) throw new TypeError('handler must be a function');
    const match = compile(path, !method);
    for (const fn of handlers) stack.push({ method, match, fn });
  }
  app.use = (path, ...handlers) => {
    if (typeof path === 'function') { handlers.unshift(path); path = '/'; }
    add(path, handlers);
    return app;
  };
  app.listen = (port, cb) => {
    if (listeningApp) throw new Error('Only one app may listen per Node environment');
    const ready = native.start({ host: '127.0.0.1', ...options, port }, (id, raw) => {
      const res = createResponse(id, native);
      try { dispatch(stack, createRequest(raw), res); }
      catch (error) { if (!res.headersSent) res.status(500).type('text').send('Internal Server Error'); }
    });
    listeningApp = app;
    closing = undefined;
    app.ready = ready.then(boundPort => {
      app.emit('listening');
      if (cb) cb();
      return boundPort;
    }, error => {
      if (listeningApp === app) listeningApp = undefined;
      if (app.listenerCount('error')) app.emit('error', error);
      throw error;
    });
    // The caller can await ready or subscribe to error. Do not leave a second
    // unobserved rejection when they choose the event-based interface.
    app.ready.catch(() => {});
    return app;
  };
  app.close = cb => {
    if (!closing) {
      closing = (listeningApp === app ? native.stop() : Promise.resolve()).then(() => {
        if (listeningApp === app) listeningApp = undefined;
        app.emit('close');
      });
    }
    if (cb) closing.then(() => cb(), cb);
    return closing;
  };
  app.stats = () => native.stats();
  return app;
}
module.exports = { createApp };
