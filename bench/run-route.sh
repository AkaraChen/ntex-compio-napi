#!/bin/bash
# Re-run a single route/route-set across every target.
#
# Exists because run-extreme.sh's first pass wrote the /users/42 results into a
# path that contained the route's own slash; those cells are missing and this
# re-measures exactly them with the same methodology, writing to a separate
# summary so nothing is overwritten.
#
# Usage: ROUTES="/users/42" CONNS="128" ./run-route.sh
set -u

OHA="${OHA:-$HOME/tmp/oha}"
BENCH="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$BENCH/results-extreme}"
DUR="${DUR:-10}"
WARMUP="${WARMUP:-3}"
REPS="${REPS:-2}"
SERVER_CPUS="${SERVER_CPUS:-0-3}"
CLIENT_CPUS="${CLIENT_CPUS:-4-7}"
ROUTES="${ROUTES:-/users/42}"
CONNS="${CONNS:-128}"

export PATH="/home/akrc/.cargo/bin:/home/akrc/.bun/bin:/home/akrc/.local/share/fnm/node-versions/v24.20.0/installation/bin:$PATH"
export npm_config_cache=/home/akrc/ntex-bench/.npm-cache
ulimit -n 65536 2>/dev/null || true

mkdir -p "$OUT"
SUMMARY="$OUT/summary-route.tsv"
printf 'target\truntime\troute\tconn\trep\trps\tp50_ms\tp90_ms\tp99_ms\ttotal\tsuccess_pct\tserver_cores\tclient_cores\tserver_peak_rss_mb\tloadavg\tmemavail_mb\n' > "$SUMMARY"

declare -A PORTS=(
  [node-http]=18901 [fastify]=18902 [express]=18903
  [bun-http]=18904 [elysia]=18905 [ntex-w1]=18906 [ntex-w4]=18907
)
TARGETS=(node-http express fastify bun-http elysia ntex-w1 ntex-w4)

start_server() {
  local name="$1" port="$2"
  SRV_LOG="$OUT/server-route-$name.log"
  if ss -ltn 2>/dev/null | grep -q ":$port "; then
    echo "PORT $port ALREADY IN USE - refusing to run $name"; return 1
  fi
  : > "$SRV_LOG"
  case "$name" in
    node-http) env PORT="$port" taskset -c "$SERVER_CPUS" node "$BENCH/node-http-server.js" >>"$SRV_LOG" 2>&1 & ;;
    express)   env PORT="$port" taskset -c "$SERVER_CPUS" node "$BENCH/express-server.js"   >>"$SRV_LOG" 2>&1 & ;;
    fastify)   env PORT="$port" taskset -c "$SERVER_CPUS" node "$BENCH/fastify-server.js"   >>"$SRV_LOG" 2>&1 & ;;
    bun-http)  env PORT="$port" taskset -c "$SERVER_CPUS" bun  "$BENCH/bun-http-server.js"  >>"$SRV_LOG" 2>&1 & ;;
    elysia)    env PORT="$port" taskset -c "$SERVER_CPUS" bun  "$BENCH/elysia-server.js"    >>"$SRV_LOG" 2>&1 & ;;
    ntex-w1)   env PORT="$port" WORKERS=1 MAX_IN_FLIGHT=16384 MAX_QUEUED=0 \
                 taskset -c "$SERVER_CPUS" node "$BENCH/ntex-server.js" >>"$SRV_LOG" 2>&1 & ;;
    ntex-w4)   env PORT="$port" WORKERS=4 MAX_IN_FLIGHT=16384 MAX_QUEUED=0 \
                 taskset -c "$SERVER_CPUS" node "$BENCH/ntex-server.js" >>"$SRV_LOG" 2>&1 & ;;
  esac
  SRV_PID=$!
  for _ in $(seq 1 150); do
    grep -q READY "$SRV_LOG" && return 0
    kill -0 "$SRV_PID" 2>/dev/null || { echo "SERVER DIED: $name"; cat "$SRV_LOG"; return 1; }
    sleep 0.1
  done
  echo "SERVER TIMEOUT: $name"; return 1
}

stop_server() {
  kill "$SRV_PID" 2>/dev/null
  wait "$SRV_PID" 2>/dev/null
  for _ in $(seq 1 100); do
    ss -ltn 2>/dev/null | grep -q ":$1 " || return 0
    sleep 0.1
  done
}

run_cell() {
  local target="$1" route="$2" conn="$3" rep="$4" port="$5"
  local slug="${route#/}"; slug="${slug//\//_}"
  local base="$OUT/${target}__${slug}__c${conn}__r${rep}"
  local url="http://127.0.0.1:${port}${route}"

  taskset -c "$CLIENT_CPUS" "$OHA" -z "${WARMUP}s" -c "$conn" --no-tui "$url" >/dev/null 2>&1
  taskset -c "$CLIENT_CPUS" "$OHA" -z "${DUR}s" -c "$conn" --no-tui -j "$url" > "${base}.json" 2>/dev/null &
  local oha_pid=$!
  python3 "$BENCH/sampler.py" "$SRV_PID,$oha_pid" "${base}.res.json" 0.05 &
  local samp_pid=$!
  wait "$oha_pid"
  kill -TERM "$samp_pid" 2>/dev/null
  wait "$samp_pid" 2>/dev/null

  python3 - "${base}.json" "${base}.res.json" "$target" "$route" "$conn" "$rep" "$SUMMARY" <<'PY'
import json, sys
oha_path, res_path, target, route, conn, rep, summary = sys.argv[1:8]
def load(p):
    try: return json.load(open(p))
    except Exception: return {}
d = load(oha_path)
if isinstance(d, list): d = d[0] if d else {}
try:
    rps = d["summary"]["requestsPerSec"]; total = d["summary"]["total"]
    succ = d["summary"]["successRate"] * 100
    lp = d.get("latencyPercentiles", {})
    p50, p90, p99 = lp.get("p50"), lp.get("p90"), lp.get("p99")
except Exception:
    rps = total = succ = p50 = p90 = p99 = "NA"
r = load(res_path).get("pids", {})
vals = list(r.values())
sc = vals[0].get("cpu_cores") if len(vals) > 0 and vals[0].get("cpu_cores") is not None else "NA"
srss = vals[0]["peak_rss_mb"] if len(vals) > 0 else "NA"
cc = vals[1].get("cpu_cores") if len(vals) > 1 and vals[1].get("cpu_cores") is not None else "NA"
def ms(v):
    try: return f"{v*1000:.3f}"
    except Exception: return "NA"
load_avg = open("/proc/loadavg").read().split()[0]
mem = 0
for line in open("/proc/meminfo"):
    if line.startswith("MemAvailable:"):
        mem = int(line.split()[1]) // 1024; break
runtime = "bun" if target in ("bun-http", "elysia") else ("compio" if target.startswith("ntex") else "node")
with open(summary, "a") as f:
    f.write(f"{target}\t{runtime}\t{route}\t{conn}\t{rep}\t{rps}\t{ms(p50)}\t{ms(p90)}\t{ms(p99)}\t{total}\t{succ}\t{sc}\t{cc}\t{srss}\t{load_avg}\t{mem}\n")
print(f"  {target:10s} {route:10s} c={conn:<5s} r={rep}  rps={rps if rps=='NA' else round(rps)}  srv={sc if sc=='NA' else round(sc,2)}  cli={cc if cc=='NA' else round(cc,2)}")
PY
}

echo "=== route re-run: ROUTES='$ROUTES' CONNS='$CONNS' ==="
echo "duration=${DUR}s warmup=${WARMUP}s reps=${REPS}"
echo "start loadavg=$(cut -d' ' -f1-3 /proc/loadavg)"
echo

for target in "${TARGETS[@]}"; do
  port="${PORTS[$target]}"
  echo "--- $target (port $port) ---"
  start_server "$target" "$port" || continue
  sleep 1
  for route in $ROUTES; do
    for conn in $CONNS; do
      for rep in $(seq 1 "$REPS"); do
        run_cell "$target" "$route" "$conn" "$rep" "$port"
      done
    done
  done
  stop_server "$port"
  echo
done

echo "=== done, summary at $SUMMARY ==="
