'use strict';
function createRequest(raw) {
  const split = raw.url.indexOf('?');
  const query = Object.create(null);
  for (const [key, value] of new URLSearchParams(split < 0 ? '' : raw.url.slice(split + 1))) {
    if (!(key in query)) query[key] = value;
    else if (Array.isArray(query[key])) query[key].push(value);
    else query[key] = [query[key], value];
  }
  const headers = Object.assign(Object.create(null), raw.headers);
  return {
    method: raw.method, path: split < 0 ? raw.url : raw.url.slice(0, split),
    url: raw.url, originalUrl: raw.url, query, params: Object.create(null),
    headers, body: raw.body, ip: raw.ip,
    get(name) { return headers[String(name).toLowerCase()]; },
  };
}
module.exports = { createRequest };
