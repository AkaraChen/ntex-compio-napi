# Extreme sweep: where each stack tops out, and what it costs

Seven stacks, six concurrency levels to **c=2048**, CPU and RSS sampled for **both** the server
and the load generator on every single run.

## Headline

- **The ceiling is 51,793 req/s — Elysia on Bun.** Nothing got closer.
- **Nothing is stopped by the machine.** Every single-threaded stack sits pinned at
  **1.00 server core** from c=32 onward while the load generator only uses ~1.5–2.3 of its 4
  cores. The wall is the one JS thread, not the CPU.
- **This project is the fastest Node-hosted stack** (ntex w=4: **30,719**) — it beats bare
  `node:http` (28,956) and Fastify (26,957), and is 2.35× Express.
- **But it is the least core-efficient, and its tail latency is the worst in the field.**
  At c=2048 its p50 is **148 ms** (w=1) against Elysia's **44 ms**. That is the honest price of
  funnelling every request through one JS thread.
- **Bun is flat, Node declines.** From c=32 to c=2048 bare Node loses **32%** of its throughput
  (28,956 → 19,581) and Express loses 15%. Bun holds 41–45k across the whole range.

---

## Setup

| | |
|---|---|
| machine | `eric-remote-builder` — AMD EPYC 9645, 8 vCPU, 15 GB RAM, kernel 7.0.0-30 |
| server pinned to | cores **0–3** (`taskset`) |
| load generator pinned to | cores **4–7** (`taskset`) |
| load generator | `oha 1.4.5` |
| concurrency | **1, 32, 128, 512, 1024, 2048** |
| timing | 3 s warm-up + **10 s measured**, **2 runs per cell** — both reps reported |
| fd limit | raised to 65536 (2048 sockets × 2 sides) |
| route | `GET /hello` → `Hello World` (11 bytes, identical on every stack) |
| middleware | none anywhere — no loggers, no plugins |

| stack | version | runtime |
|---|---|---|
| `node-http` | `node:http` built-in | Node 24.20.0 |
| `express` | 5.2.1 | Node 24.20.0 |
| `fastify` | 5.12.4 | Node 24.20.0 |
| `bun-http` | `Bun.serve` built-in | Bun 1.4.2 |
| `elysia` | 1.4.30 | Bun 1.4.2 |
| `ntex-w1` | this project, `workers: 1` | compio 0.11 via neon, hosted in Node 24 |
| `ntex-w4` | this project, `workers: 4` | compio 0.11 via neon, hosted in Node 24 |

`ntex` ran with `maxInFlight: 16384, maxQueued: 0` so its admission limiter stays out of the
way at every load level — otherwise the extreme cells would be 503s rather than HTTP.

**Clean-machine measures taken (they are visible in the data, not assumed):**
a leftover 4-hour test job on the box was **fully suspended** (`SIGSTOP`, then resumed after the
sweep — it is running again) because it held a core and 3 GB. Per-run load average and available
memory are recorded in `results-extreme/summary.tsv`. Start load average was 1.30.

---

## Throughput — `GET /hello`, req/s (mean of 2 reps)

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `elysia` | 4130 | **48760** | **51793** | 44668 | **46667** | **44407** |
| `bun-http` | 3869 | 41342 | 45474 | **44424** | 43036 | 44217 |
| `ntex-w4` | 1406 | 26173 | 28917 | 30719 | 27429 | 24145 |
| `node-http` | 3792 | 28956 | 21199 | 20297 | 20601 | 19581 |
| `fastify` | 3111 | 26957 | 20314 | 20058 | 18367 | 18765 |
| `ntex-w1` | 1387 | 22306 | 19896 | 16600 | 13203 | 13518 |
| `express` | 2914 | 13082 | 10492 | 11251 | 10767 | 11104 |

### Peak, and where it happens

| target | peak rps | at | vs Express peak |
|---|---:|---:|---:|
| `elysia` | **51793** | c=128 | **3.96x** |
| `bun-http` | 45474 | c=128 | 3.48x |
| `ntex-w4` | 30719 | c=512 | 2.35x |
| `node-http` | 28956 | c=32 | 2.21x |
| `fastify` | 26957 | c=32 | 2.06x |
| `ntex-w1` | 22306 | c=32 | 1.71x |
| `express` | 13082 | c=32 | 1.00x |

## Latency — p50 (ms)

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `elysia` | **0.16** | **0.50** | **2.24** | **10.68** | **21.21** | **44.18** |
| `bun-http` | 0.17 | 0.58 | 2.60 | 11.04 | 22.97 | 44.99 |
| `node-http` | 0.17 | 0.88 | 5.42 | 21.94 | 24.85 | 35.98 |
| `express` | 0.24 | 2.03 | 10.78 | 29.12 | 28.55 | 34.68 |
| `fastify` | 0.22 | 0.92 | 5.71 | 21.86 | 30.40 | 36.76 |
| `ntex-w4` | 0.46 | 0.87 | 3.75 | 15.38 | 34.80 | 80.10 |
| `ntex-w1` | 0.48 | 1.12 | 6.01 | 29.15 | 74.23 | **147.97** |

## Latency — p99 (ms)

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `elysia` | **1.24** | **2.96** | **6.67** | 24.17 | **35.27** | 70.35 |
| `bun-http` | 1.35 | 3.47 | 6.70 | **20.18** | 38.69 | 65.24 |
| `fastify` | 1.53 | 4.67 | 13.84 | 41.90 | 51.72 | 63.79 |
| `node-http` | 1.39 | 3.88 | 14.03 | 40.04 | 45.85 | 68.52 |
| `express` | 1.63 | 7.67 | 31.15 | 63.65 | 74.50 | 69.15 |
| `ntex-w4` | 3.10 | 5.10 | 14.07 | 41.45 | 92.25 | 191.93 |
| `ntex-w1` | 3.00 | 5.40 | 14.53 | 56.05 | **142.21** | **219.73** |

## Where the CPU actually went — server cores (of 4 pinned)

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `elysia` | 0.54 | 0.97 | 1.00 | 0.99 | 0.99 | 0.98 |
| `bun-http` | 0.54 | 0.97 | 1.00 | 1.00 | 0.99 | 0.99 |
| `node-http` | 0.57 | 0.98 | 0.99 | 0.99 | 0.99 | 0.99 |
| `express` | 0.65 | 0.99 | 0.99 | 1.00 | 0.99 | 0.99 |
| `fastify` | 0.58 | 0.97 | 0.99 | 0.99 | 1.00 | 1.00 |
| `ntex-w1` | 0.77 | 1.50 | 1.54 | 1.45 | 1.42 | 1.41 |
| `ntex-w4` | 0.74 | 2.48 | 2.80 | 3.02 | 3.02 | 2.95 |

And the load generator, so you can see it was never the bottleneck (4 cores available):

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `elysia` | 0.70 | 1.92 | 2.24 | 2.22 | 2.26 | 2.18 |
| `bun-http` | 0.69 | 1.82 | 2.08 | 2.12 | 2.11 | 2.26 |
| `node-http` | 0.65 | 1.55 | 1.53 | 1.49 | 1.53 | 1.39 |
| `express` | 0.52 | 1.10 | 0.98 | 1.12 | 1.13 | 1.11 |
| `fastify` | 0.66 | 1.56 | 1.55 | 1.50 | 1.54 | 1.51 |
| `ntex-w1` | 0.38 | 1.19 | 1.14 | 0.89 | 0.73 | 0.89 |
| `ntex-w4` | 0.40 | 1.49 | 1.73 | 1.80 | 1.75 | 1.70 |

**No cell is client-bound.** The client never exceeded 2.26 of its 4 cores. So the numbers above
are the servers' numbers.

## Peak RSS (MB) of the server process

| target | c=1 | c=32 | c=128 | c=512 | c=1024 | c=2048 |
|---|---:|---:|---:|---:|---:|---:|
| `bun-http` | 35 | 40 | 41 | 41 | 41 | **42** |
| `elysia` | 48 | 50 | 50 | 50 | 50 | **50** |
| `ntex-w1` | 63 | 78 | 96 | 127 | 164 | 196 |
| `node-http` | 74 | 79 | 89 | 112 | 150 | 213 |
| `express` | 88 | 96 | 109 | 139 | 158 | 218 |
| `fastify` | 91 | 99 | 107 | 139 | 162 | 228 |
| `ntex-w4` | 64 | 86 | 125 | 209 | 260 | **294** |

## Other routes at c=128

`GET /json`

| target | rps | p50 | p99 | srv cores | cli cores |
|---|---:|---:|---:|---:|---:|
| `elysia` | **47738** | **2.433** | **7.073** | 1.00 | 1.94 |
| `bun-http` | 44842 | 2.571 | 7.477 | 1.01 | 2.09 |
| `ntex-w4` | 25942 | 4.207 | 16.631 | 2.89 | 1.67 |
| `node-http` | 21852 | 5.380 | 12.447 | 0.99 | 1.44 |
| `fastify` | 17738 | 6.489 | 17.797 | 0.98 | 1.43 |
| `ntex-w1` | 17563 | 6.690 | 17.982 | 1.50 | 0.90 |
| `express` | 10154 | 10.881 | 27.306 | 0.99 | 1.14 |

`GET /users/42` (path parameter)

| target | rps | srv cores | cli cores |
|---|---:|---:|---:|
| `elysia` | **46237** | 1.00 | 2.16 |
| `bun-http` | 43823 | 1.00 | 2.09 |
| `ntex-w4` | 29514 | 2.90 | 1.76 |
| `node-http` | 20217 | 1.00 | 1.58 |
| `fastify` | 18651 | 0.99 | 1.38 |
| `ntex-w1` | 18622 | 1.55 | 1.11 |
| `express` | 9114 | 1.00 | 1.05 |

---

## What this actually says

**1. The wall is one JS thread, and you can see it in the CPU column.**
Every stack that runs its request path on a single JS thread — Node, Bun, Express, Fastify,
Elysia — sits at **0.97–1.00 server cores from c=32 all the way to c=2048**. Adding concurrency
does not buy them anything because there is no second core to use. That, not the hardware, is
the ceiling: the same 8-core box could push far more if the request path were parallel.

**2. Bun's HTTP stack is roughly 1.6× more efficient per core than Node's.**
Bare `Bun.serve` does 45,474 rps on ~1.0 core; bare `node:http` does 28,956 on ~1.0 core. Same
one core, 1.57× the throughput. That is the runtime, not the framework.

**3. My "bare runtime ceiling" was not a ceiling — Elysia beat it.**
`elysia` (51,793) is **faster than my hand-written bare `Bun.serve`** (45,474). My bare server
called `new URL(req.url)` and did string compares; Elysia uses a compiled router. Lesson worth
keeping: *a bare-runtime baseline is only an upper bound if it is written well* — measure your
own baseline before you call it one. `bun-http` here should be read as "a naively written Bun
server", not "Bun's limit".

**4. This project buys throughput with cores, and is the least efficient per core.**
ntex w=4 peaks at **30,719** — the best Node-hosted result, ahead of bare `node:http` (28,956)
and Fastify (26,957). But it spends **~3.0 cores** to get there, where everything else spends
~1.0. Its result at c=128 is 28,917 rps for 2.80 cores. So:
**throughput: 1st among Node-hosted. Cores per request: last.**
Those two facts are the same fact.

**5. Its tail latency at high concurrency is the worst in the field — this is the real finding.**
At c=2048, ntex w=1 has a **p50 of 148 ms** and a **p99 of 220 ms**, against Elysia's 44/70 ms.
At c=1024 it is 74/142 ms. This is not noise, it is structural: every request crosses the NAPI
boundary to the single JS thread, so at high concurrency they queue behind each other in that
one thread while the Rust side sits mostly idle (1.41 of 4 cores at c=2048 — *below* its own
c=32 usage). Throughput holds up; the shape of the latency distribution does not.
**For a request/response API with latency SLOs, this stack is only appropriate below roughly
c=128.** Above that, its p99 is 3× the competition's.

**6. Node degrades as concurrency rises; Bun does not.**
Bare Node loses **32%** of its peak between c=32 and c=2048 (28,956 → 19,581) and Express loses
15%, while Bun stays within 41–45k across the whole range. More sockets on one thread means more
per-request bookkeeping. Anyone sizing a Node service for high connection counts should read
that as "peak throughput is at *low* concurrency, and it gets worse from there".

**7. Memory: Bun is flat, Node-based stacks grow with concurrency.**
Bun/Elysia hold **35–50 MB regardless of concurrency** — 2048 sockets cost them almost nothing.
The Node-based stacks grow from ~80 MB to **213–228 MB**, and ntex w=4 reaches **294 MB**
(4 compio workers + one pending entry per in-flight request). At 10k concurrent connections that
gap matters more than the throughput gap does.

**8. At c=1 this project is still the slowest (1,387–1,406 vs Elysia 4,130).**
Consistent with the earlier round: the NAPI round trip costs ~0.3 ms per request, which is
roughly half of the total time at single-connection load. The framework only pays off once
concurrency is high enough to hide that latency — and per finding 5, it stops being a good trade
somewhere before c=1024.

---

## Caveats

- **Client and server share the same 8-core box** (pinned to disjoint cores, 4 each). No cell was
  client-bound — the client stayed ≤ 2.26 cores — so this did not distort the results, but it is
  still loopback with no NIC.
- **Two reps per cell is a smoke test, not a statistical treatment.** Every rep is in
  `results-extreme/summary.tsv`; some cells differ by ~10%. Treat 10% differences as noise.
- One leftover 4-hour job on the machine was **suspended** for the sweep and resumed afterwards.
  That is a real intervention, disclosed here deliberately.
- `ntex` ran at `maxInFlight: 16384` — the limiter was configured out of the way on purpose, so
  these numbers show the *engine*, not the *protected* configuration you would ship.
- Response headers differ slightly (`fastify`/`elysia` use `text/plain`, `express` adds
  `ETag` + `X-Powered-By`). Bodies and lengths are identical everywhere.
- Only Linux x86_64, Node 24.20.0, Bun 1.4.2, one route shape. Not a statement about real apps.

## Reproducing

```sh
cd bench
DUR=10 REPS=2 ./run-extreme.sh          # full sweep, ~35 min
ROUTES="/users/42" CONNS=128 ./run-route.sh   # single-route re-run
python3 analyze-extreme.py results-extreme/summary.tsv
```

Raw `oha` JSON and per-run resource samples are in `results-extreme/`.
