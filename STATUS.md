# Status

Completed M1 → M5 in order on 2026-09-14. Each milestone gate has captured output in [EVIDENCE.md](EVIDENCE.md) and a local commit. The follow-up body/admission work is also complete and committed locally. No work was pushed.

## Done and measured

- M1: pinned stable Neon 1.1.1 / ntex 3.12.3 source build; Node loaded the addon and called `stats()`.
- M2: dedicated compio thread served a fixed native response; curl returned 200; tokio count was 0.
- M3: curl received a JS-produced response; dispatch logged `isMainThread=true threadId=0`.
- M4: Express-shaped façade and runnable demo. All six demo route definitions were exercised, including both forms of the optional route, plus 404. Raw curl output covers GET, params, POST, wildcard, 404 and 500.
- M5: final suite **8 passed, 0 failed**, 5638.708301 ms. Each of **1, 2, 4 workers** passed 80 concurrent distinct binary requests, with every handler reaching JS before any response was released. Stats reported 80 requests, 0 in-flight and 0 timeouts for each worker experiment.
- Sync/async errors, including thrown null/undefined, produced 500 without timing out. Unanswered handlers produced 504; timedOut increased; inFlight returned to 0; late replies did not interfere with later requests.
- Two child processes exited naturally with code 0 after `app.close()`: active async response drained with 200; unanswered request finished with 504. No child calls `process.exit()`.
- Bind failure, input validation, duplicate replies, stale IDs and restart were tested.
- M5 `cargo build --release` succeeded in 5.69 seconds through the build wrapper. Artifact: `/home/akrc/Developer/ntex-compio-napi/index.node`, ELF x86-64 shared object. The wrapper copies Cargo's `.so` to `.node`.
- Final dependency tree: **0 tokio entries**, compio-runtime 0.11.0 through ntex-net and ntex-rt. Clippy with `-D warnings` and `cargo fmt --check` passed.
- README, evidence and this status are complete. The original reference spike is unchanged.

## Follow-up done and measured

- Added validated `maxBodyBytes` (default 1048576, range 1–1073741824), `maxInFlight` (default 1024, range 1–1000000), and `maxQueued` (default 0, range 0–1000000). The façade already forwards options and exposes native stats; no JS façade change was needed.
- Content-Length is checked before body reads and admission. Chunk accumulation checks remaining capacity before appending. Rust returns 413 with the cap in its body and closes the connection without draining. Exactly-cap bodies pass with Content-Length and chunked framing; cap+1 is refused, including an incomplete chunked upload. Refusal dispatch counters stayed zero; fresh connections returned 200.
- Admission and queue transfer share one lock across workers. The extended `PendingGuard` owns reservation, queue, cancellation and response state. Admission reserves a slot before upload to prevent buffering outside the bound; `inFlight` and `peakInFlight` include these reservations. Queued uploads remain unread by the bridge.
- `stats()` adds configured limits, `rejected413`, `rejected503`, `peakInFlight`, and `queued`. With `maxInFlight=4`, `maxQueued=0`, each of workers=1 and workers=2 admitted exactly 4 of 12 requests to JS, refused 8 with 503 and `Retry-After: 1`, peaked at 4, and returned inFlight to 0 after gate release.
- 32 concurrent incomplete oversized uploads at a 65536-byte cap all returned 413; no middleware ran. Peak reservations were 32 against a limit of 32. RSS before: **61853696 bytes**; after: **68497408 bytes**; delta: **6643712 bytes**. These samples include clients in the same Node process and do not measure peak or long-run RSS.
- The boundary run counted 3 body refusals; the upload/admission precedence run counted 1 body refusal and 1 capacity refusal. The bounded queue run peaked at 1 active plus 2 queued, refused 1, cancelled a disconnected queue entry, and drained in request order. All counters are per-start, not suite totals.
- Slot recovery is tested after JS timeout, late response, active disconnect, upload disconnect, queued disconnect, native dispatch throw, graceful shutdown, and forced shutdown. Timeout also promotes a queued request. A stalled upload plus a queued request both had their sockets closed at the shutdown budget, with zero dispatches and zero remaining entries; restart served 200.
- Busy-JS test: a real HTTP client in a separate Node worker received 12 timeouts while the main JS thread was intentionally blocked; expired requests never dispatched, peak stayed at 1, and the next request succeeded. Buffered bytes stay in guarded state and Channel notifications are coalesced, avoiding a stale callback backlog.
- New queue testing exposed a pinned ntex idle-then-shutdown failure. Explicit async bridge draining before stopping workers fixes the regression; budget expiration cancels remaining requests on their owning workers. The failed first run is preserved in evidence.
- Final gate: **19 passed, 0 failed**, **9935.567729 ms**. Release build succeeded in **6.33 seconds**; clippy with `-D warnings` and formatting passed; normal dependency tree contains **0 tokio entries**. No dependencies or runtime architecture changed. Raw output is in [EVIDENCE.md](EVIDENCE.md) and `evidence/limits-*.log`.

## Deviations

This assigned follow-up goes beyond the original M1–M5 spec by implementing body and admission caps, bounded queueing, counters, and shutdown cancellation. Reserving capacity before collection deliberately extends `inFlight` to include uploads. The original eight tests still pass, but they could not all remain textually unchanged: the shared exact-object assertion in the three worker concurrency cases needed the newly required stats fields. No old behavioral assertion or default workload changed. The queue test also required the shutdown correction described above.

## Not done / unknown

No requested limit is left unenforced on an identified bridge path, and no required follow-up measurement is missing. The package has not been published or pushed. Generated binaries are present locally and intentionally ignored by Git.

Bodies remain fully buffered and copied; there is no streaming or response-size cap. Limits do not cap total RSS, kernel/ntex socket buffers, total connections, or data/work retained by JS. Timeout/disconnect releases bridge capacity but cannot cancel user JS execution. No separate upload or queue-wait deadline was added: slow uploads can hold reserved slots and delay queued requests until disconnect or shutdown. Protocol-level parsing failures can be rejected by ntex before reaching the bridge and are outside its refusal counters.

Not measured: production throughput, long-run or peak RSS, other operating systems/Node versions, forced Node Worker teardown, exhaustive disconnect races, or resource-exhaustion fault injection. The original Express/HTTP exclusions remain unchanged. All known test failures are corrected; historical failed runs remain in evidence.

## Most important human check

Check the deployment's **slow-upload timeout policy**: admission now bounds memory-bearing requests, but a client can hold a reserved slot without finishing its body. Set and verify the upstream upload/connection deadlines under realistic traffic before exposing the service to untrusted clients. The recorded RSS sample and concurrency checks are not a production capacity benchmark.
