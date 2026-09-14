#!/usr/bin/env python3
"""Sample CPU time and RSS of one or more PIDs until SIGTERM.

Why this exists: a throughput number alone cannot distinguish "the server was
fast" from "the client was the bottleneck". Sampling both the server and the
load-generator process lets the report say which side saturated, and at how
many cores.

CPU comes from /proc/<pid>/stat utime+stime, which counts ALL threads, so it is
literally "how many cores' worth of CPU this process burned".

IMPORTANT: the final reading must come from the last SUCCESSFUL sample inside
the loop, never from a read after the process exited -- reading after exit
returns nothing and silently turns the metric into NA. (That was a real bug in
the first version of this script.)

Usage: sampler.py <pid>[,<pid>...] <out.json> [interval_seconds]
"""
import json
import os
import signal
import sys
import time

CLK = os.sysconf("SC_CLK_TCK")

pids = [int(p) for p in sys.argv[1].split(",") if p]
out_path = sys.argv[2]
interval = float(sys.argv[3]) if len(sys.argv) > 3 else 0.05

stopping = False


def _stop(_signum, _frame):
    global stopping
    stopping = True


signal.signal(signal.SIGTERM, _stop)
signal.signal(signal.SIGINT, _stop)


def read_pid(pid):
    """-> (cpu_seconds, rss_kb) or None if the process is gone/unreadable."""
    try:
        with open(f"/proc/{pid}/stat", "rb") as fh:
            raw = fh.read().decode("utf-8", "replace")
        # comm can contain spaces and parentheses; everything after the LAST ')' is fixed-format
        fields = raw[raw.rindex(")") + 2:].split()
        cpu = (int(fields[11]) + int(fields[12])) / CLK
        rss_kb = 0
        with open(f"/proc/{pid}/status") as fh2:
            for line in fh2:
                if line.startswith("VmRSS:"):
                    rss_kb = int(line.split()[1])
                    break
        return cpu, rss_kb
    except (OSError, ValueError, IndexError):
        return None


first = {}
last_ok = {}
peak_rss = {p: 0 for p in pids}
samples = {p: 0 for p in pids}

start = time.time()
while not stopping:
    for pid in pids:
        got = read_pid(pid)
        if got is None:
            continue
        cpu, rss = got
        if pid not in first:
            first[pid] = cpu
        last_ok[pid] = cpu
        samples[pid] += 1
        if rss > peak_rss[pid]:
            peak_rss[pid] = rss
    time.sleep(interval)
wall = time.time() - start

result = {"wall_seconds": round(wall, 3), "pids": {}}
for pid in pids:
    if pid in first and pid in last_ok:
        cpu_used = max(0.0, last_ok[pid] - first[pid])
    else:
        cpu_used = None
    result["pids"][str(pid)] = {
        "cpu_seconds": None if cpu_used is None else round(cpu_used, 4),
        "cpu_cores": None if (cpu_used is None or wall <= 0) else round(cpu_used / wall, 4),
        "peak_rss_mb": round(peak_rss[pid] / 1024.0, 2),
        "samples": samples[pid],
    }

with open(out_path, "w") as fh:
    json.dump(result, fh)
