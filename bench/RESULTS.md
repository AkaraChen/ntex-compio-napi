# Benchmark: Express 5.2.1 vs ntex-on-compio through neon

**Headline: it depends entirely on concurrency.** At one connection at a time Express is
**2.0× faster**. From 32 concurrent connections up, this project is **1.6×–2.9× faster**, with
**2.3× lower p99 latency** at c=128.

---

## Setup

| | |
|---|---|
| machine | `eric-remote-builder` — AMD EPYC 9645, 8 vCPU, 15 GB RAM, kernel 7.0.0-30 |
| load generator | `oha 1.4.5`, pinned to cores **4–7** |
| server under test | pinned to cores **0–3** (`taskset`), so client and server never share a core |
| protocol | HTTP/1.1, keep-alive, loopback |
| timing | **3 s warm-up** then **10 s measured**, **2 runs per cell** — both runs reported |
| route | `GET /hello` → `Hello World` (11 bytes) |
| revision | `1860eb2` |
| addon | built by `scripts/build.sh` from that revision |
| admission limits | `maxInFlight=4096`, `maxQueued=4096` — deliberately raised far above the load levels under test, so this measures the HTTP path rather than the new limiter |
| middleware | **none** on either side. The demo's `console.log` middleware would dominate the measurement and tell us nothing about the HTTP stack |

All **32 measured runs succeeded at 100%** — no errors, no dropped connections, no timeouts.

Fairness note: the two sides return byte-identical bodies with identical `Content-Type` and
`Content-Length`. They are *not* header-identical — Express also emits `X-Powered-By` and a
computed `ETag`, which this project does not. `express-bare` (`etag` and `x-powered-by`
disabled) is included to isolate how much of Express's cost that header work actually is.

Contention was measured, not assumed: a leftover batch job on the box was `renice`'d to 19
before the run, and load average + available memory were recorded for every single run
(they are in `results/summary.tsv`).

---

## Throughput — `GET /hello`, req/s (mean of 2 runs)

| target | c=1 | c=32 | c=128 |
|---|---:|---:|---:|
| `express` (5.2.1, defaults) | **1902** | 10786 | 10293 |
| `express-bare` (no etag/x-powered-by) | 2074 | 13483 | 11984 |
| `ntex` workers=1 | 927 | 17674 | 18827 |
| `ntex` workers=4 | 1166 | **21618** | **29686** |

Relative to Express:

| target | c=1 | c=32 | c=128 |
|---|---:|---:|---:|
| `express-bare` | 1.09× | 1.25× | 1.16× |
| `ntex` workers=1 | **0.49×** | 1.64× | 1.83× |
| `ntex` workers=4 | **0.61×** | 2.00× | **2.88×** |

## Latency — `GET /hello` (ms, mean of 2 runs)

| target | c | p50 | p90 | p99 |
|---|---:|---:|---:|---:|
| `express` | 1 | 0.340 | 1.049 | 2.738 |
| `ntex` w1 | 1 | 0.778 | 2.094 | 4.397 |
| `ntex` w4 | 1 | 0.586 | 1.671 | 3.435 |
| `express` | 32 | 2.337 | 5.454 | 10.560 |
| `ntex` w1 | 32 | 1.357 | 3.575 | 6.895 |
| `ntex` w4 | 32 | 1.075 | 3.065 | 6.015 |
| `express` | 128 | 10.910 | 18.783 | **30.334** |
| `ntex` w1 | 128 | 6.290 | 10.483 | 15.826 |
| `ntex` w4 | 128 | **3.723** | **7.712** | **13.068** |

## JSON route — `GET /json` at c=32 (ms, req/s)

| target | rps | p50 | p99 |
|---|---:|---:|---:|
| `express` | 10623 | 2.346 | 10.293 |
| `express-bare` | 13216 | 1.862 | 8.634 |
| `ntex` w1 | **17539** | 1.398 | 6.560 |
| `ntex` w4 | 16252 | 1.469 | 8.089 |

JSON narrows the gap: `res.json` means Express's `JSON.stringify` + ETag hashing runs on the
same thread that also parses HTTP, whereas here stringifying happens on the JS side while
HTTP stays on the compio side.

---

## What the numbers actually say

**1. The single-connection penalty is the NAPI round trip, and it is ~0.25–0.44 ms.**
At c=1 throughput is just `1 / latency`. Express answers in 0.34 ms (p50); this project takes
0.59–0.78 ms. That difference is exactly the cost of the hop: the compio worker thread hands
the request across a neon `Channel` to the **JS main thread**, the JS router runs, and
`respond()` hands the response back. Two cross-thread wakes per request. This is the price of
the entire design — the HTTP engine is in Rust, the routing is in JS.

**2. Express saturates and then degrades.** From c=32 → c=128 Express's throughput goes *down*
(10786 → 10293) while p99 nearly triples (10.6 → 30.3 ms). Its single JS thread is full; extra
concurrency only buys queueing. This project at the same load goes *up* and stays there.

**3. Four workers only buy 1.6×, and the reason is structural.** 18827 → 29686 rps is a 1.58×
gain from 4× the workers. The compio worker threads are not the bottleneck — they all funnel
into the **one Node main thread** where `dispatch` runs. The JS dispatch path is the ceiling.
Adding Rust workers cannot raise it; only making JS dispatch cheaper or moving routing into
Rust could.

**4. A measurable slice of Express's cost is its defaults, not its HTTP core.** Turning off
`etag` and `x-powered-by` alone is worth 1.09×–1.25×. Worth remembering before attributing all
of Express's cost to "Node is slow".

**5. This is not "Rust beats Node".** That comparison would be a native ntex app with Rust
handlers, which pays no NAPI round trip at all. What is measured here is *Express-shaped JS
routing on top of a Rust HTTP engine*, and it is deliberately paying a per-request tax to get
that shape. The interesting result is that the tax is affordable under concurrency and
noticeable only when a single client is waiting on each response in turn.

---

## Caveats (please read before quoting any of this)

- **Client and server share one 8-core box.** They are pinned to disjoint cores, which
  mitigates but does not eliminate interference. Loopback also means no NIC, no real network.
- **A leftover batch job was deprioritised, not stopped.** It was `renice`'d to 19 before the
  run. Per-run load average (2.6–6.6) and available memory (~4.7 GB) are in
  `results/summary.tsv` so the contention level is visible rather than hidden.
- **One route, one method, no middleware, no body parsing, no error paths.** A real app's
  profile will differ.
- **Two runs per cell is a smoke test, not a statistical treatment.** Variance between the two
  runs is visible in `results/summary.tsv`; some cells differ by ~10%.
- Throughput here is bounded by the single JS dispatch thread; numbers will not improve with
  more cores on the server side.

## Reproducing

```sh
cd bench
sudo ./run-bench.sh          # needs `oha` and `express` installed; see run-bench.sh header
```

Raw per-run output from `oha` is in `results/`; the aggregate table is `results/summary.tsv`.
