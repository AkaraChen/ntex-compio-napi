#!/bin/bash
# Controlled express-vs-ntex-compio-napi benchmark.
#
# Measurement hygiene:
#   * server pinned to SERVER_CPUS, load generator pinned to CLIENT_CPUS, so the
#     two never compete for the same core
#   * 3s warm-up before every measured run (JIT / lazy init)
#   * REPS runs per cell, reported individually -- no cherry-picking
#   * loadavg + available memory recorded per run, so contention is visible
#     instead of assumed away
set -u

OHA="${OHA:-$HOME/tmp/oha}"
BENCH="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$BENCH/results}"
DUR="${DUR:-10}"
WARMUP="${WARMUP:-3}"
REPS="${REPS:-2}"
SERVER_CPUS="${SERVER_CPUS:-0-3}"
CLIENT_CPUS="${CLIENT_CPUS:-4-7}"

export PATH="/home/akrc/.cargo/bin:/home/akrc/.local/share/fnm/node-versions/v24.20.0/installation/bin:$PATH"

mkdir -p "$OUT"
SUMMARY="$OUT/summary.tsv"
printf 'target\troute\tconn\trep\trps\tp50_ms\tp90_ms\tp99_ms\ttotal\tsuccess_pct\tloadavg\tmemavail_mb\n' > "$SUMMARY"

start_server() { # name -> sets SRV_PID, SRV_LOG
  local name="$1" port="$2"
  SRV_LOG="$OUT/server-$name.log"
  : > "$SRV_LOG"
  case "$name" in
    express|express-bare)
      local env_extra="PORT=$port"
      [ "$name" = "express-bare" ] && env_extra="$env_extra ETAG=0 XPB=0"
      env $env_extra taskset -c "$SERVER_CPUS" node "$BENCH/express-server.js" >>"$SRV_LOG" 2>&1 &
      ;;
    ntex-w1|ntex-w4)
      local w=1; [ "$name" = "ntex-w4" ] && w=4
      env PORT="$port" WORKERS="$w" taskset -c "$SERVER_CPUS" node "$BENCH/ntex-server.js" >>"$SRV_LOG" 2>&1 &
      ;;
  esac
  SRV_PID=$!
  for _ in $(seq 1 100); do
    grep -q READY "$SRV_LOG" && return 0
    kill -0 "$SRV_PID" 2>/dev/null || { echo "SERVER DIED: $name"; cat "$SRV_LOG"; return 1; }
    sleep 0.1
  done
  echo "SERVER TIMEOUT: $name"; return 1
}

stop_server() {
  kill "$SRV_PID" 2>/dev/null
  wait "$SRV_PID" 2>/dev/null
  # give the kernel a moment to release the listening socket
  for _ in $(seq 1 50); do
    ss -ltn 2>/dev/null | grep -q ":$1 " || return 0
    sleep 0.1
  done
}

run_cell() { # target route conn rep port
  local target="$1" route="$2" conn="$3" rep="$4" port="$5"
  local json="$OUT/${target}__${route#/}__c${conn}__r${rep}.json"

  taskset -c "$CLIENT_CPUS" "$OHA" -z "${WARMUP}s" -c "$conn" --no-tui "http://127.0.0.1:${port}${route}" >/dev/null 2>&1
  taskset -c "$CLIENT_CPUS" "$OHA" -z "${DUR}s" -c "$conn" --no-tui -j "http://127.0.0.1:${port}${route}" > "$json" 2>/dev/null

  python3 - "$json" "$target" "$route" "$conn" "$rep" "$SUMMARY" <<'PY'
import json, sys
path, target, route, conn, rep, summary = sys.argv[1:7]
try:
    d = json.load(open(path))
    rps   = d["summary"]["requestsPerSec"]
    total = d["summary"]["total"]
    succ  = d["summary"]["successRate"] * 100
    lp    = d.get("latencyPercentiles", {})
    p50, p90, p99 = lp.get("p50"), lp.get("p90"), lp.get("p99")
except Exception as e:
    print(f"PARSE FAIL {path}: {e}", file=sys.stderr)
    rps = total = succ = p50 = p90 = p99 = "NA"
def ms(v):
    try:    return f"{v*1000:.3f}"
    except Exception: return "NA"
load = open("/proc/loadavg").read().split()[0]
mem  = 0
for line in open("/proc/meminfo"):
    if line.startswith("MemAvailable:"):
        mem = int(line.split()[1]) // 1024
        break
with open(summary, "a") as f:
    f.write(f"{target}\t{route}\t{conn}\t{rep}\t{rps}\t{ms(p50)}\t{ms(p90)}\t{ms(p99)}\t{total}\t{succ}\t{load}\t{mem}\n")
print(f"  {target:14s} {route:8s} c={conn:<4s} r={rep}  rps={rps}")
PY
}

declare -A PORTS=( [express]=18801 [express-bare]=18802 [ntex-w1]=18803 [ntex-w4]=18804 )
TARGETS=(express express-bare ntex-w1 ntex-w4)
CONNS=(1 32 128)

echo "=== express vs ntex-compio-napi ==="
echo "duration=${DUR}s warmup=${WARMUP}s reps=${REPS} server_cpus=${SERVER_CPUS} client_cpus=${CLIENT_CPUS}"
echo "oha=$("$OHA" --version)"
echo "start loadavg=$(cut -d' ' -f1-3 /proc/loadavg)"
echo

for target in "${TARGETS[@]}"; do
  port="${PORTS[$target]}"
  echo "--- $target (port $port) ---"
  start_server "$target" "$port" || continue
  sleep 1

  for conn in "${CONNS[@]}"; do
    for rep in $(seq 1 "$REPS"); do
      run_cell "$target" /hello "$conn" "$rep" "$port"
    done
  done
  for rep in $(seq 1 "$REPS"); do
    run_cell "$target" /json 32 "$rep" "$port"
  done

  stop_server "$port"
  echo
done

echo "=== done, summary at $SUMMARY ==="
