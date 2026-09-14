# Status

Completed M1 → M5 in order on 2026-09-14. Each milestone gate has captured output in [EVIDENCE.md](EVIDENCE.md) and a local commit. No work was pushed.

## Done and measured

- M1: pinned stable Neon 1.1.1 / ntex 3.12.3 source build; Node loaded the addon and called `stats()`.
- M2: dedicated compio thread served a fixed native response; curl returned 200; tokio count was 0.
- M3: curl received a JS-produced response; dispatch logged `isMainThread=true threadId=0`.
- M4: Express-shaped façade and runnable demo. All six demo route definitions were exercised, including both forms of the optional route, plus 404. Raw curl output covers GET, params, POST, wildcard, 404 and 500.
- M5: final suite **8 passed, 0 failed**, 5638.708301 ms. Each of **1, 2, 4 workers** passed 80 concurrent distinct binary requests, with every handler reaching JS before any response was released. Stats reported 80 requests, 0 in-flight and 0 timeouts for each worker experiment.
- Sync/async errors, including thrown null/undefined, produced 500 without timing out. Unanswered handlers produced 504; timedOut increased; inFlight returned to 0; late replies did not interfere with later requests.
- Two child processes exited naturally with code 0 after `app.close()`: active async response drained with 200; unanswered request finished with 504. No child calls `process.exit()`.
- Bind failure, input validation, duplicate replies, stale IDs and restart were tested.
- Final `cargo build --release` succeeded in 5.69 seconds through the build wrapper. Artifact: `/home/akrc/Developer/ntex-compio-napi/index.node`, ELF x86-64 shared object. The wrapper copies Cargo's `.so` to `.node`.
- Final dependency tree: **0 tokio entries**, compio-runtime 0.11.0 through ntex-net and ntex-rt. Clippy with `-D warnings` and `cargo fmt --check` passed.
- README, evidence and this status are complete. The original reference spike is unchanged.

## Not done / unknown

No required milestone is blocked or incomplete. The package has not been published. Generated binaries are present locally and intentionally ignored by Git.

Not measured: production throughput, long-run memory behavior, other operating systems/Node versions, forced Node Worker teardown, exhaustive disconnect races or resource-exhaustion failures. There are no streaming, upload-size or queue limits. The JS response timeout begins after body collection. Full Express compatibility and the explicitly excluded HTTP features remain outside scope.

One first-run test failed due to a test's capitalization of HTTP 418; the preserved log and correction are described in README. Final tests are green. Packaging and additive API details are explicitly documented under README's “Deviations”.

## Most important human check

Before using this with untrusted or large traffic, decide and implement **body-size and admission limits**: the current bridge buffers bodies and has no queue/backpressure bound. The concurrency and shutdown measurements establish correctness for this task, not production capacity.
