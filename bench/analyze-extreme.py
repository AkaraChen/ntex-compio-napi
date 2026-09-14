#!/usr/bin/env python3
"""Turn results-extreme/summary.tsv into the tables used in RESULTS-EXTREME.md.

Deliberately dumb: it aggregates and formats, it does not interpret. Numbers
are printed for ALL reps individually too, so nothing can be cherry-picked.
"""
import collections
import csv
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "summary.tsv"
rows = list(csv.DictReader(open(path), delimiter="\t"))

ORDER = ["node-http", "express", "fastify", "bun-http", "elysia", "ntex-w1", "ntex-w4"]
CONNS = sorted({int(r["conn"]) for r in rows})


def f(v):
    try:
        return float(v)
    except Exception:
        return None


def agg(target, route, conn):
    rs = [r for r in rows if r["target"] == target and r["route"] == route and int(r["conn"]) == conn]
    if not rs:
        return None
    out = {}
    for key in ("rps", "p50_ms", "p90_ms", "p99_ms", "server_cores", "client_cores",
                "server_peak_rss_mb", "success_pct"):
        vals = [f(r[key]) for r in rs]
        vals = [v for v in vals if v is not None]
        out[key] = sum(vals) / len(vals) if vals else None
    out["_reps"] = [f(r["rps"]) for r in rs]
    return out


def present_targets(route):
    return [t for t in ORDER if any(r["target"] == t and r["route"] == route for r in rows)]


print("## Throughput — `GET /hello`, req/s (mean of 2 reps)\n")
ts = present_targets("/hello")
print("| target | " + " | ".join(f"c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['rps']:.0f}" if a and a["rps"] else "NA")
    print(f"| `{t}` | " + " | ".join(cells) + " |")

print("\n## Peak throughput per target\n")
# compute every peak FIRST: computing lazily made the express row compare
# against itself and print 1.00x for everything before it in the ordering.
peaks = {}
where = {}
for t in ts:
    best, bestc = 0.0, None
    for c in CONNS:
        a = agg(t, "/hello", c)
        if a and a["rps"] and a["rps"] > best:
            best, bestc = a["rps"], c
    peaks[t] = best
    where[t] = bestc
base = peaks.get("express", 1.0)
print("| target | peak rps | at concurrency | x vs express peak |")
print("|---|---:|---:|---:|")
for t in ts:
    print(f"| `{t}` | {peaks[t]:.0f} | {where[t]} | {peaks[t] / base:.2f}x |")
print(f"\nAbsolute best in the sweep: **{max(peaks.values()):.0f} rps**"
      f" (`{max(peaks, key=peaks.get)}`)")

print("\n## p50 latency (ms)\n")
print("| target | " + " | ".join(f"c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['p50_ms']:.2f}" if a and a["p50_ms"] else "NA")
    print(f"| `{t}` | " + " | ".join(cells) + " |")

print("\n## Server peak RSS (MB)\n")
print("| target | " + " | ".join(f"c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['server_peak_rss_mb']:.0f}" if a and a["server_peak_rss_mb"] else "NA")
    print(f"| `{t}` | " + " | ".join(cells) + " |")

print("\n## Server CPU cores used (mean of 2 reps) — is the server or the client saturated?\n")
print("| target | " + " | ".join(f"c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['server_cores']:.2f}" if a and a["server_cores"] else "NA")
    print(f"| `{t}` srv | " + " | ".join(cells) + " |")
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['client_cores']:.2f}" if a and a["client_cores"] else "NA")
    print(f"| `{t}` cli | " + " | ".join(cells) + " |")

print("\n## Peak RSS (MB) and p99 latency (ms)\n")
print("| target | " + " | ".join(f"RSS c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['server_peak_rss_mb']:.0f}" if a and a["server_peak_rss_mb"] else "NA")
    print(f"| `{t}` | " + " | ".join(cells) + " |")

print("\n| target | " + " | ".join(f"p99 c={c}" for c in CONNS) + " |")
print("|---|" + "---:|" * len(CONNS))
for t in ts:
    cells = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        cells.append(f"{a['p99_ms']:.2f}" if a and a["p99_ms"] else "NA")
    print(f"| `{t}` | " + " | ".join(cells) + " |")

print("\n## Other routes at c=128\n")
for route in ("/json", "/users/42"):
    if not any(r["route"] == route for r in rows):
        continue
    print(f"\n| target | rps | p50 | p99 | srv cores | cli cores |")
    print("|---|---:|---:|---:|---:|---:|")
    for t in present_targets(route):
        a = agg(t, route, 128)
        if a:
            print(f"| `{t}` | {a['rps']:.0f} | {a['p50_ms']:.3f} | {a['p99_ms']:.3f} | "
                  f"{a['server_cores']:.2f} | {a['client_cores']:.2f} |")

print("\n## Raw per-rep rps (verifies nothing was cherry-picked)\n")
for t in ts:
    line = []
    for c in CONNS:
        a = agg(t, "/hello", c)
        if a:
            line.append(f"c={c}: " + "/".join(f"{v:.0f}" for v in a["_reps"] if v))
    print(f"- `{t}`: " + "  ".join(line))

succs = sorted({r["success_pct"] for r in rows})
print(f"\nSuccess rates present across all {len(rows)} rows: {succs}")
