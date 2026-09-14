'use strict';
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function compile(path, prefix = false) {
  if (typeof path !== 'string' || (!path.startsWith('/') && path !== '*')) throw new TypeError('path must start with /');
  if (path === '*' || (prefix && path === '/')) return () => Object.create(null);
  const names = [];
  const parts = path.replace(/\/$/, '').split('/').slice(1);
  let pattern = '^';
  for (const [i, part] of parts.entries()) {
    if (part === '*') {
      if (i !== parts.length - 1) throw new TypeError('wildcard must be trailing');
      names.push('0'); pattern += '(?:/(.*))?';
    } else if (part.startsWith(':')) {
      const match = /^:([A-Za-z_][A-Za-z0-9_]*)(\?)?$/.exec(part);
      if (!match) throw new TypeError(`Invalid path parameter: ${part}`);
      names.push(match[1]); pattern += match[2] ? '(?:/([^/]+))?' : '/([^/]+)';
    } else { pattern += '/' + escape(part); }
  }
  const regex = new RegExp(pattern + (prefix ? '(?=/|$)' : '/?$'));
  return path => {
    const match = regex.exec(path);
    if (!match) return null;
    const params = Object.create(null);
    names.forEach((name, i) => { if (match[i + 1] !== undefined) params[name] = decodeURIComponent(match[i + 1]); });
    return params;
  };
}
function dispatch(stack, req, res) {
  let cursor = 0;
  function advance(error) {
    if (res.headersSent) return;
    while (cursor < stack.length) {
      const layer = stack[cursor++];
      if (Boolean(error) !== (layer.fn.length === 4)) continue;
      if (layer.method && layer.method !== 'ALL' && layer.method !== req.method && !(req.method === 'HEAD' && layer.method === 'GET')) continue;
      let params;
      try { params = layer.match(req.path); }
      catch (err) { error = err; continue; }
      if (!params) continue;
      req.params = params;
      let advanced = false;
      const next = err => {
        if (advanced) return;
        advanced = true;
        advance(err);
      };
      const failed = err => next(err || new Error('Handler threw or rejected without an error'));
      try {
        const result = error ? layer.fn(error, req, res, next) : layer.fn(req, res, next);
        Promise.resolve(result).catch(failed);
      } catch (err) { failed(err); }
      return;
    }
    if (error) res.status(500).type('text').send('Internal Server Error');
    else res.status(404).type('text').send(`Cannot ${req.method} ${req.path}`);
  }
  advance();
}
module.exports = { compile, dispatch };
