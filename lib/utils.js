'use strict';
const types = {
  html: 'text/html; charset=utf-8', text: 'text/plain; charset=utf-8',
  txt: 'text/plain; charset=utf-8', json: 'application/json; charset=utf-8',
  css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  xml: 'application/xml; charset=utf-8', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  bin: 'application/octet-stream',
};
function contentType(value) {
  const type = String(value);
  return types[type.replace(/^\./, '')] || (type.includes('/') ? type : 'application/octet-stream');
}
module.exports = { contentType };
