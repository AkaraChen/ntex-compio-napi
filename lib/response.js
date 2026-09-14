'use strict';
const { STATUS_CODES, validateHeaderName, validateHeaderValue } = require('node:http');
const { contentType } = require('./utils');
function createResponse(id, native) {
  const headers = Object.create(null);
  return {
    statusCode: 200, headersSent: false,
    status(n) {
      if (!Number.isInteger(n) || n < 200 || n > 599) throw new RangeError('status must be an integer in 200..599');
      this.statusCode = n;
      return this;
    },
    set(key, value) {
      if (this.headersSent) throw new Error('Response already sent');
      if (typeof key === 'object' && key !== null) {
        for (const [k, v] of Object.entries(key)) this.set(k, v);
      } else {
        key = String(key).toLowerCase();
        validateHeaderName(key);
        if (Array.isArray(value)) {
          value = value.map(String);
          for (const item of value) validateHeaderValue(key, item);
        } else { value = String(value); validateHeaderValue(key, value); }
        headers[key] = value;
      }
      return this;
    },
    get(key) { return headers[String(key).toLowerCase()]; },
    type(value) { return this.set('content-type', contentType(value)); },
    send(body) {
      if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) return this.json(body);
      if (!this.get('content-type')) this.type(Buffer.isBuffer(body) ? 'bin' : 'html');
      return this.end(body);
    },
    json(value) {
      const body = JSON.stringify(value);
      if (!this.get('content-type')) this.type('json');
      return this.end(body);
    },
    end(body) {
      if (this.headersSent) return this;
      body = body == null ? Buffer.alloc(0) : Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      // These statuses cannot carry a message body. HEAD is handled by ntex,
      // retaining the byte length of the equivalent GET response.
      if (this.statusCode === 204 || this.statusCode === 304) {
        body = Buffer.alloc(0);
        delete headers['content-type'];
        delete headers['content-length'];
      } else {
        headers['content-length'] = String(body.length);
      }
      delete headers['transfer-encoding'];
      const pairs = Object.entries(headers).flatMap(([key, value]) =>
        (Array.isArray(value) ? value : [value]).map(v => [key, v]));
      native.respond(id, this.statusCode, pairs, body);
      this.headersSent = true;
      return this;
    },
    redirect(status, url) {
      if (url === undefined) { url = status; status = 302; }
      return this.status(status).set('location', url).type('text').send(`Redirecting to ${url}`);
    },
    sendStatus(status) { return this.status(status).type('text').send(STATUS_CODES[status] || String(status)); },
  };
}
module.exports = { createResponse };
