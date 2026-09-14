'use strict';
const http = require('node:http');
const { execFileSync } = require('node:child_process');
function freePort(start) {
  const listeners = execFileSync('ss', ['-H', '-ltn'], { encoding: 'utf8' });
  const used = new Set([...listeners.matchAll(/:(\d+)\s/g)].map(match => Number(match[1])));
  while (used.has(start)) start++;
  console.log(`ss -H -ltn checked: port ${start} is free`);
  return start;
}
function request(port, path, { method = 'GET', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), text: Buffer.concat(chunks).toString() }));
      res.on('error', reject);
    });
    req.setTimeout(6000, () => req.destroy(new Error(`HTTP timeout: ${method} ${path}`)));
    req.on('error', reject);
    req.end(body);
  });
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports = { freePort, request, delay };
