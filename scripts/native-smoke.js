const native = require('../index.node');
const { isMainThread, threadId } = require('node:worker_threads');
native.start({ host: '127.0.0.1', port: 18721, workers: 1 }, (id, request) => {
  console.log(`dispatch isMainThread=${isMainThread} threadId=${threadId} ${request.method} ${request.url}`);
  native.respond(id, 200, { 'content-type': 'text/plain' }, 'hello from JavaScript via compio\n');
}).then(() => console.log('READY')).catch(error => { console.error(error); process.exitCode = 1; });
process.on('SIGTERM', async () => {
  console.log('stats', native.stats());
  await native.stop();
  console.log('STOPPED');
});
