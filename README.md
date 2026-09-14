# ntex × compio × Neon

An Express-shaped JavaScript HTTP server backed by ntex **3.12.3**, compio, and Neon **1.1.1**. Routing and JSON serialization run in JavaScript. Rust transfers request/response data through a Neon Channel and asynchronous one-shot receivers.

Measured on this Linux x86_64 machine: the release addon loads in Node 24.20.0, the dependency tree has **zero tokio entries**, and all **19 real-socket integration tests pass** (the original eight plus eleven limit tests). Compio worker counts **1, 2, and 4** each completed 80 simultaneous, distinct binary requests correctly. Two child-process tests prove natural exit after graceful shutdown. Raw output is in [EVIDENCE.md](EVIDENCE.md); completion details are in [STATUS.md](STATUS.md).

## Build and run

From this repository:

```sh
. ./scripts/env.sh
npm run build
ss -ltnp
npm run demo
```

`env.sh` adds this machine's Rust and Node installations to PATH and places Cargo/npm caches inside the repository. There are no npm dependencies to install. A first build downloads Rust dependencies; subsequent builds use the local cache. `Cargo.lock` pins the resolved dependency graph.

The demo listens at `http://127.0.0.1:18731`. Check `ss` before starting it; choose a different free port with `PORT=18732 npm run demo` if needed. Ports **18080 and 3000 were already occupied** during development; neither service was changed.

```sh
curl -i http://127.0.0.1:18731/hello
curl -i http://127.0.0.1:18731/users/alice
curl -i --data-binary 'hello body' http://127.0.0.1:18731/echo
curl -i http://127.0.0.1:18731/optional
curl -i http://127.0.0.1:18731/optional/Ada
curl -i http://127.0.0.1:18731/files/a/b.txt
curl -i http://127.0.0.1:18731/missing
curl -i http://127.0.0.1:18731/fail
```

Ctrl-C gracefully closes the demo. It does not call `process.exit()`.

The build wrapper runs `cargo build --release`, then copies `target/release/libntex_compio_napi.so` to **`index.node`**. The measured loadable artifact is `/home/akrc/Developer/ntex-compio-napi/index.node`. Generated binaries and caches are ignored by Git; rebuild them from the committed source.

## Use

```js
const { createApp } = require('ntex-compio-napi')
// Inside this repository, use require('.') instead.
const app = createApp({ host: '127.0.0.1', workers: 1, timeoutMs: 30_000 })

app.use((req, res, next) => {
  res.set('x-example', 'yes')
  next()
})
app.get('/hello', (req, res) => res.send('Hello World'))
app.get('/users/:id', (req, res) => res.json({ id: req.params.id }))
app.post('/echo', async (req, res) => {
  await Promise.resolve()
  res.json({ got: req.body.toString() })
})
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})

app.listen(18732, () => console.log('listening'))
app.ready.catch(console.error)
// Later: await app.close(), or app.close(() => console.log('closed'))
```

The package is local and private; it has not been published to npm. `app.listen(port[, cb])` returns the app immediately. `app.ready` resolves to the bound port after ntex binds, or rejects on startup failure. The app also emits `listening`, `error` (when subscribed), and `close`. `app.close([cb])` returns a Promise that settles after native shutdown and channel/root cleanup. Calls to close are idempotent.

Supported routing:

- `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, `all`, each taking a path and one or more handlers.
- `use(fn)` and `use(path, fn)` for middleware prefixes, with segment boundaries: `/api` does not match `/apiary`. Prefix middleware leaves `req.url` and `req.path` intact.
- Required `:name`, optional `:name?`, trailing `/*` captured as `req.params[0]`, and `*` for all paths. Parameter values are percent-decoded. Matching is case-sensitive and accepts a trailing slash.
- Ordered `next()` / `next(err)` chains and four-argument error handlers. Sync exceptions and rejected async handlers become 500 responses. A handler must respond or call `next()`; simply returning a value does not send it. Unhandled routes produce 404.
- HEAD can fall back to a GET handler. Register an explicit HEAD handler before the GET handler if it should take precedence.

`req` provides `method`, `path`, `url`, `originalUrl`, `query`, `params`, lower-case `headers`, a Buffer `body`, case-insensitive `get(name)`, and the peer `ip`. Repeated query keys become arrays; query and parameter objects have null prototypes. `ip` does not trust proxy headers.

`res` provides chainable `status(n)`, `set(k, v)` / `set(obj)`, `get(k)`, `type(t)`, `send(body)`, `json(obj)`, `end([body])`, `redirect([status,] url)`, and `sendStatus(n)`. `send` infers HTML for strings, binary for Buffers, and JSON for objects; `json` infers JSON. Both calculate UTF-8 byte length. Explicit content types are retained. Header values may be arrays for repeated headers. ntex suppresses HEAD bodies while preserving the corresponding length. 204/304 bodies are discarded. Final status codes must be integers in 200–599.

## Native interface and lifecycle

`require('./index.node')` has exactly four exports:

| Export | Contract |
| --- | --- |
| `start(options, dispatch)` | `options` has `host`, `port`, optional `workers`, `timeoutMs`, `maxBodyBytes`, `maxInFlight`, and `maxQueued`. Returns a Promise immediately; resolves to the port. Calls `dispatch(id, {method, url, headers, body, ip})` for requests. |
| `respond(id, status, headers, body)` | Completes a pending request without waiting. Headers are an object of strings or an array of `[name, value]` string pairs. Body is a string or Buffer. Returns `false` for expired, duplicate, or stale IDs. |
| `stop()` | Returns a Promise for graceful shutdown. Stops accepting, drains requests within the shutdown budget, releases the JS root and referenced Channel, then settles. |
| `stats()` | Returns `{runtime: 'compio', requests, workers, inFlight, timedOut, rejected413, rejected503, peakInFlight, queued, maxInFlight, maxQueued, maxBodyBytes}`. The façade exposes the same result as `app.stats()`. |

IDs are opaque decimal strings representing Rust `u64` values, avoiding JS Number precision loss. IDs remain unique across server restarts. One app can listen per Node environment; another app cannot accidentally close it.

`start` creates a referenced Channel and a rooted JS dispatch function on the JS thread, then starts the `napi-http` OS thread. That thread creates `System::new("napi-http", DefaultRuntime)` and drives ntex's `HttpServer` with compio. ntex manages its own configured workers. Node signal handling remains in JS; native ntex signal handlers are disabled.

Each handler checks Content-Length, reserves capacity (or asynchronously waits in the bounded queue), collects capped body bytes, and schedules JS through `Channel::try_send`. It **awaits** a one-shot receiver; no Channel join is called. Short shared-state locks never enclose an await or a JS invocation. A single drop guard owns the slot and any queued/pending entry, releasing or transferring it on response, body error, timeout, observed socket disconnect, dispatch exception, or shutdown. Socket disconnects are watched during upload, queueing, and response wait. Channel notifications are coalesced to at most one queued notification plus the callback currently running; buffered bytes remain in guarded state until dispatch so cancellation can free them before JS runs.

The default JS response deadline is 30 seconds; `timeoutMs` accepts 1–600000. A missed deadline returns 504 and increments `timedOut`. This deadline starts after admission and body collection. It does not cancel JS work; subsequent replies for that ID are ignored. `requests` counts native handler entries. Counters reset on start and remain readable after stop.

Shutdown pauses acceptance and drains admitted/queued requests for `timeoutMs + 2000` milliseconds. At that deadline it cancels remaining uploads and queued/active requests, closes their sockets on their owning workers, and then stops ntex. Its existing worker shutdown budget still applies afterward. This explicit bridge drain also avoids an early-shutdown behavior in pinned ntex after an earlier idle period; the regression and forced-shutdown cases are covered by real sockets.

## Body and admission limits

Pass these options through `createApp(options)` or native `start(options, dispatch)`:

| Option | Default | Valid integer range | Effect |
| --- | --- | --- | --- |
| `maxBodyBytes` | 1048576 (1 MiB) | 1–1073741824 (1 GiB) | Maximum buffered request body length. |
| `maxInFlight` | 1024 | 1–1000000 | Shared capacity across all workers. Slots are reserved before upload and held through the JS response wait. |
| `maxQueued` | 0 | 0–1000000 | Additional requests allowed to wait for a slot; zero rejects immediately when full. |

Non-finite, fractional, or out-of-range numbers throw a `RangeError`, using the same validation style as `workers` and `timeoutMs`.

An oversized Content-Length receives **413 Payload Too Large before any body is read by the bridge**, even when admission is full. Otherwise each received chunk is checked before appending; crossing the cap stops collection immediately. The response names `maxBodyBytes` and its byte value. Rejected bodies are not drained. When all slots and queue entries are occupied, Rust returns **503 Service Unavailable** with `Retry-After: 1`. Both refusals close the connection; a new connection can be used for the next request.

**Limit-generated 413/503 responses never reach JS dispatch, user middleware, or handlers.** Applications therefore cannot customize them through middleware. `rejected413` counts body-cap refusals; `rejected503` counts capacity refusals (not application-produced statuses or shutdown/channel failures).

Admission occurs before body collection so uploads cannot build an unbounded collection of buffered requests outside the queue. `inFlight` consequently includes reserved uploads as well as pending JS responses, until the Rust handler obtains a response or exits. `peakInFlight` is the high-water mark of those reservations and cannot exceed `maxInFlight`. `queued` counts requests awaiting promotion; queued bodies are not collected by the bridge. Freed slots transfer to waiting requests in request-ID order under the same shared lock. The three configured limits are returned by `app.stats()` alongside the counters.

## Verification

```sh
. ./scripts/env.sh
npm run build
npm test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
cargo tree -e normal | grep -c tokio
cargo tree -i compio-runtime
```

`grep -c` prints `0` and exits with status 1 when it finds no matches; that is the expected no-tokio result.

Tests use Node's HTTP client and real loopback sockets. Before each bind, the test helper reads `ss -H -ltn` and selects an unused port. The bind-failure test deliberately occupies its own port with a Node server. A port check cannot eliminate an intervening bind race; startup errors are reported.

The concurrency test requires **all 80 handlers to reach JS before releasing any response**, then deliberately varies response timing and compares distinct binary bodies and IDs. It passed independently with `workers=1`, `2`, and `4`. These are correctness measurements, not throughput benchmarks or proof of a performance improvement from more workers.

Shutdown tests launch separate children with a parent watchdog. Children drain an active async response (200) or let an unanswered handler time out (504), call close, and exit naturally with code 0. They contain no `process.exit()`. The suite also checks methods, request fields, response helpers, middleware, default/custom errors, late/duplicate replies, native validation, startup failure and restart.

The first hardening run passed 7/8 tests: its only failure was an incorrect test expectation for Node's capitalization of HTTP 418 (`I'm a Teapot`). The expectation now uses Node's `STATUS_CODES`. The original failure is retained in `evidence/m5-tests-first.log`. The M5 final run passed 8/8 in 5638.708301 ms. The follow-up limit gate passes 19/19; the historical and current outputs are retained in EVIDENCE.md. There are no unresolved test failures.

## Deviations

- **Assigned follow-up beyond the original spec:** request body caps, bounded admission/queueing, refusal counters, and limit statistics close the previously declared production gaps. Admission reserves slots before body collection, so `inFlight` now also includes uploads. The existing concurrency tests needed only an expanded expected `stats()` object for the additive fields; their original behavioral assertions remain intact.
- **Shutdown correction required by the follow-up:** explicit asynchronous bridge draining and forced cancellation cover the pinned ntex idle-then-shutdown regression exposed by the new queue test.

- **Artifact packaging:** Cargo's Linux cdylib output has a `.so` suffix. `npm run build` / `scripts/build.sh` performs the conventional copy to `.node` for Node's addon loader. A bare `cargo build --release` produces the `.so`; use the wrapper to refresh `index.node`.
- **Small additive controls:** `timeoutMs`, `stats().timedOut`, startup/shutdown Promises, and façade `app.ready` / `app.stats()` make timeout and lifecycle behavior observable without adding native exports. Defaults preserve the requested `listen(port, cb)` shape.
- **Demo port:** 18731 replaces the illustrative 3000 because 3000 was occupied on this machine.

The runtime/threading architecture is unchanged from the requested design. No beta crates, tokio feature, JSON parsing in application Rust code, native route matching, or blocking request round-trip was introduced.

## Limits and unknowns

Request and response bodies are still fully buffered and copied; these are caps, not streaming support. Request bytes and admission are capped, but response sizes, JS-retained data/work, total process RSS, and total open connections are not. Kernel/ntex socket buffers are outside the request-byte cap. There is no separate upload or queue-wait deadline: slow uploads can hold reserved slots and delay the bounded queue until disconnect or shutdown. The JS response timeout begins after upload and does not cancel JS work. Configure an upstream connection/upload timeout if needed. Repeated incoming header names currently retain the last value; non-UTF-8 header values are converted lossily to strings. This is a small façade, not full Express compatibility.

Templates, Router sub-routers, cookies/sessions, static serving, TLS and HTTP/2 are not implemented or tested. Only Linux x86_64, the recorded kernel, Rust 1.97.1, and Node 24.20.0 were measured. Long soak tests, throughput/latency benchmarks, exhaustive client disconnect races, resource-exhaustion fault injection, and abrupt Node Worker termination remain unmeasured. OS thread creation errors have a cleanup path, but that failure was not injected.

The reference spike is unchanged and was not used as the build target. All work is committed locally; nothing was pushed or published.
