'use strict';
const { workerData } = require('node:worker_threads');
const { request } = require('../helpers');
const sync = new Int32Array(workerData.sync);
(async () => {
  try {
    for (let i = 0; i < 12; i++) {
      const result = await request(workerData.port, '/', { method: 'POST', body: Buffer.alloc(4096) });
      if (result.status !== 504) throw new Error(`expected 504, got ${result.status}`);
      Atomics.add(sync, 1, 1);
    }
  } catch (error) {
    console.error(error);
    Atomics.store(sync, 2, 1);
  } finally {
    Atomics.store(sync, 0, 1);
    Atomics.notify(sync, 0);
  }
})();
