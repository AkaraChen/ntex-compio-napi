# Captured evidence

Commands ran from `/home/akrc/Developer/ntex-compio-napi` after `. ./scripts/env.sh` on 2026-09-14. Outputs below are captured process output, not reconstructed responses. Source logs are retained in `evidence/`. M1/M2/M3 describe their historical implementations at their milestone commits; the final addon uses the JS bridge. The reference spike was not built as the deliverable.

`grep -c tokio` prints 0 with exit code 1 for no matches. `cargo fmt --check` produced no output and exited 0. `scripts/build.sh` runs `cargo build --release` then copies the `.so` to `index.node`.

The first M5 test run had one assertion failure (HTTP 418 phrase capitalization in the test); its original output appears after the successful final gate. No milestone remains failed.


## M1 — build and load

$ `rustc --version; cargo --version; node --version`

```text
rustc 1.97.1 (8bab26f4f 2026-07-14)
cargo 1.97.1 (c980f4866 2026-06-30)
v24.20.0
```

$ `sh scripts/build.sh (cargo build --release; copy .so to index.node)`

```text
    Updating crates.io index
     Locking 189 packages to latest compatible versions
 Downloading crates ...
  Downloaded adler2 v2.0.1
  Downloaded addr2line v0.25.1
  Downloaded atoi_simd v0.18.1
  Downloaded atomic-waker v1.1.2
  Downloaded env_filter v2.0.0
  Downloaded event-listener-strategy v0.5.4
  Downloaded debug_unsafe v0.1.4
  Downloaded async-channel v2.5.0
  Downloaded async-task v4.7.1
  Downloaded cfg-if v1.0.4
  Downloaded core_affinity v0.8.3
  Downloaded futures-sink v0.3.34
  Downloaded scoped-tls v1.0.1
  Downloaded futures-task v0.3.34
  Downloaded httpdate v1.0.3
  Downloaded io_uring_buf_ring v0.2.3
  Downloaded itoa v1.0.18
  Downloaded multiversion_no_op v1.0.0
  Downloaded neon-macros v1.1.1
  Downloaded parking v2.2.1
  Downloaded form_urlencoded v1.2.2
  Downloaded percent-encoding v2.3.2
  Downloaded cfg_aliases v0.2.2
  Downloaded compio-log v0.1.0
  Downloaded errno v0.3.14
  Downloaded linkme-impl v0.3.37
  Downloaded mime v0.3.17
  Downloaded multiversion-macros v0.9.0
  Downloaded compio-buf v0.8.3
  Downloaded serde_urlencoded v0.7.1
  Downloaded num_cpus v1.17.0
  Downloaded env_logger v0.11.11
  Downloaded paste v1.0.15
  Downloaded arrayvec v0.7.8
  Downloaded foldhash v0.2.0
  Downloaded multiversion v0.9.0
  Downloaded nanorand v0.8.0
  Downloaded futures-core v0.3.34
  Downloaded ntex-dispatcher v3.2.1
  Downloaded compio-net v0.11.1
  Downloaded concurrent-queue v2.5.0
  Downloaded futures-macro v0.3.34
  Downloaded libloading v0.8.9
  Downloaded ntex-codec v1.2.1
  Downloaded ntex-error v2.6.0
  Downloaded ntex-macros v3.5.0
  Downloaded compio-runtime v0.11.0
  Downloaded core_detect v1.0.0
  Downloaded crossbeam-queue v0.3.14
  Downloaded futures-timer v3.0.4
  Downloaded lock_api v0.4.14
  Downloaded linkme v0.3.37
  Downloaded event-listener v5.4.2
  Downloaded futures-channel v0.3.34
  Downloaded either v1.18.0
  Downloaded ntex-service v4.6.0
  Downloaded bitflags v2.13.2
  Downloaded quote v1.0.47
  Downloaded send_wrapper v0.6.0
  Downloaded rustc_version v0.4.1
  Downloaded scopeguard v1.2.0
  Downloaded getrandom v0.2.17
  Downloaded ntex-httparse v2.1.0
  Downloaded ntex-server v3.11.2
  Downloaded ntex-tls v3.8.0
  Downloaded oneshot v0.2.1
  Downloaded parking_lot_core v0.9.12
  Downloaded crossbeam-utils v0.8.23
  Downloaded compio-io v0.9.1
  Downloaded ntex-http v1.2.0
  Downloaded base64 v0.22.1
  Downloaded log v0.4.34
  Downloaded ntex-bytes v1.9.0
  Downloaded ntex-io v3.13.1
  Downloaded ntex-polling v3.10.0
  Downloaded ntex-router v1.1.0
  Downloaded ntex-rt v3.17.2
  Downloaded ntex-util v3.6.1
  Downloaded once_cell v1.21.4
  Downloaded parking_lot v0.12.5
  Downloaded rustc-demangle v0.1.28
  Downloaded bytes v1.12.1
  Downloaded getrandom v0.4.3
  Downloaded httparse v1.10.1
  Downloaded miniz_oxide v0.8.9
  Downloaded ntex-net v3.15.0
  Downloaded proc-macro2 v1.0.107
  Downloaded backtrace v0.3.76
  Downloaded compio-driver v0.11.4
  Downloaded crossbeam-channel v0.5.17
  Downloaded flume v0.12.0
  Downloaded memchr v2.8.3
  Downloaded derive_more v2.1.1
  Downloaded derive_more-impl v2.1.1
  Downloaded ntex-io-uring v0.7.120
  Downloaded unicode-xid v0.2.6
  Downloaded variadics_please v1.1.0
  Downloaded http v1.5.0
  Downloaded neon v1.1.1
  Downloaded ntex-h2 v3.13.0
  Downloaded io-uring v0.7.15
  Downloaded thin-cell v0.1.2
  Downloaded aho-corasick v1.1.5
  Downloaded futures-util v0.3.34
  Downloaded ntex v3.12.3
  Downloaded gimli v0.32.3
  Downloaded object v0.37.3
  Downloaded nix v0.31.3
  Downloaded pin-project-lite v0.2.17
  Downloaded semver v1.0.28
  Downloaded signal-hook-registry v1.4.8
  Downloaded simdutf8 v0.1.5
  Downloaded smallvec v1.16.1
  Downloaded swap-buffer-queue v0.2.1
  Downloaded thiserror v2.0.20
  Downloaded thiserror-impl v2.0.20
  Downloaded zmij v1.0.23
  Downloaded rustversion v1.0.23
  Downloaded sc v0.2.7
  Downloaded slab v0.4.12
  Downloaded synchrony v0.1.9
  Downloaded ryu v1.0.23
  Downloaded encoding_rs v0.8.41
  Downloaded libc v0.2.189
  Downloaded signal-hook v0.4.4
  Downloaded socket2 v0.6.5
  Downloaded spin v0.9.9
  Downloaded serde_core v1.0.229
  Downloaded unicode-ident v1.0.24
  Downloaded serde_derive v1.0.229
  Downloaded tracing-core v0.1.36
  Downloaded uuid v1.26.1
  Downloaded serde v1.0.229
  Downloaded linux-raw-sys v0.12.1
  Downloaded serde_json v1.0.151
  Downloaded regex v1.13.1
  Downloaded syn v2.0.119
  Downloaded syn v3.0.5
  Downloaded regex-syntax v0.8.11
  Downloaded rustix v1.1.4
  Downloaded tracing v0.1.44
  Downloaded regex-automata v0.4.18
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.24
   Compiling libc v0.2.189
   Compiling cfg-if v1.0.4
   Compiling bytes v1.12.1
   Compiling pin-project-lite v0.2.17
   Compiling serde_core v1.0.229
   Compiling crossbeam-utils v0.8.23
   Compiling bitflags v2.13.2
   Compiling futures-core v0.3.34
   Compiling cfg_aliases v0.2.2
   Compiling scopeguard v1.2.0
   Compiling serde v1.0.229
   Compiling slab v0.4.12
   Compiling rustix v1.1.4
   Compiling lock_api v0.4.14
   Compiling io-uring v0.7.15
   Compiling paste v1.0.15
   Compiling linux-raw-sys v0.12.1
   Compiling futures-sink v0.3.34
   Compiling futures-task v0.3.34
   Compiling arrayvec v0.7.8
   Compiling tracing-core v0.1.36
   Compiling log v0.4.34
   Compiling syn v3.0.5
   Compiling spin v0.9.9
   Compiling compio-driver v0.11.4
   Compiling tracing v0.1.44
   Compiling object v0.37.3
   Compiling memchr v2.8.3
   Compiling thiserror v2.0.20
   Compiling once_cell v1.21.4
   Compiling compio-log v0.1.0
   Compiling flume v0.12.0
   Compiling crossbeam-queue v0.3.14
   Compiling gimli v0.32.3
   Compiling parking v2.2.1
   Compiling smallvec v1.16.1
   Compiling compio-buf v0.8.3
   Compiling num_cpus v1.17.0
   Compiling socket2 v0.6.5
   Compiling parking_lot_core v0.9.12
   Compiling foldhash v0.2.0
   Compiling adler2 v2.0.1
   Compiling thin-cell v0.1.2
   Compiling miniz_oxide v0.8.9
   Compiling core_affinity v0.8.3
   Compiling errno v0.3.14
   Compiling event-listener v5.4.2
   Compiling nix v0.31.3
   Compiling rustc-demangle v0.1.28
   Compiling signal-hook v0.4.4
   Compiling async-task v4.7.1
   Compiling scoped-tls v1.0.1
   Compiling event-listener-strategy v0.5.4
   Compiling signal-hook-registry v1.4.8
   Compiling concurrent-queue v2.5.0
   Compiling ntex-rt v3.17.2
   Compiling itoa v1.0.18
   Compiling async-channel v2.5.0
   Compiling parking_lot v0.12.5
   Compiling addr2line v0.25.1
   Compiling io_uring_buf_ring v0.2.3
   Compiling crossbeam-channel v0.5.17
   Compiling swap-buffer-queue v0.2.1
   Compiling rustversion v1.0.23
   Compiling futures-timer v3.0.4
   Compiling oneshot v0.2.1
   Compiling atomic-waker v1.1.2
   Compiling ntex-service v4.6.0
   Compiling http v1.5.0
   Compiling serde_derive v1.0.229
   Compiling futures-macro v0.3.34
   Compiling thiserror-impl v2.0.20
   Compiling ntex-io-uring v0.7.120
   Compiling either v1.18.0
   Compiling syn v2.0.119
   Compiling sc v0.2.7
   Compiling futures-util v0.3.34
   Compiling getrandom v0.4.3
   Compiling ntex-polling v3.10.0
   Compiling backtrace v0.3.76
   Compiling zmij v1.0.23
   Compiling regex-syntax v0.8.11
   Compiling linkme-impl v0.3.37
   Compiling uuid v1.26.1
   Compiling encoding_rs v0.8.41
   Compiling multiversion-macros v0.9.0
   Compiling httparse v1.10.1
   Compiling percent-encoding v2.3.2
   Compiling serde_json v1.0.151
   Compiling simdutf8 v0.1.5
   Compiling linkme v0.3.37
   Compiling unicode-xid v0.2.6
   Compiling form_urlencoded v1.2.2
   Compiling multiversion v0.9.0
   Compiling env_filter v2.0.0
   Compiling synchrony v0.1.9
   Compiling regex-automata v0.4.18
   Compiling ntex-bytes v1.9.0
   Compiling compio-io v0.9.1
   Compiling multiversion_no_op v1.0.0
   Compiling debug_unsafe v0.1.4
   Compiling core_detect v1.0.0
   Compiling ntex-error v2.6.0
   Compiling compio-runtime v0.11.0
   Compiling ntex-codec v1.2.1
   Compiling ntex-http v1.2.0
   Compiling derive_more-impl v2.1.1
   Compiling compio-net v0.11.1
   Compiling regex v1.13.1
   Compiling ryu v1.0.23
   Compiling nanorand v0.8.0
   Compiling ntex-router v1.1.0
   Compiling serde_urlencoded v0.7.1
   Compiling ntex-util v3.6.1
   Compiling derive_more v2.1.1
   Compiling variadics_please v1.1.0
   Compiling neon-macros v1.1.1
   Compiling atoi_simd v0.18.1
   Compiling env_logger v0.11.11
   Compiling ntex-io v3.13.1
   Compiling ntex-httparse v2.1.0
   Compiling ntex-macros v3.5.0
   Compiling getrandom v0.2.17
   Compiling libloading v0.8.9
   Compiling semver v1.0.28
   Compiling ntex-net v3.15.0
   Compiling ntex-dispatcher v3.2.1
   Compiling base64 v0.22.1
   Compiling httpdate v1.0.3
   Compiling mime v0.3.17
   Compiling send_wrapper v0.6.0
   Compiling futures-channel v0.3.34
   Compiling neon v1.1.1
   Compiling ntex-server v3.11.2
   Compiling ntex-tls v3.8.0
   Compiling ntex-h2 v3.13.0
   Compiling ntex v3.12.3
   Compiling ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `release` profile [optimized] target(s) in 44.98s
```

$ `realpath index.node; file index.node; node -e "console.log(require('./index.node').stats())"`

```text
/home/akrc/Developer/ntex-compio-napi/index.node
index.node: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, BuildID[sha1]=58ddce7425ef4e029934aef0e16d29d424b74aa8, not stripped
{ runtime: 'compio' }
```


## M2 — native fixed response (before JS bridge)

$ `sh scripts/build.sh`

```text
   Compiling ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `release` profile [optimized] target(s) in 4.53s
```

$ `python3 scripts/native-smoke.py m2`

```text
$ ss -ltnp
State  Recv-Q Send-Q               Local Address:Port  Peer Address:PortProcess                                   
LISTEN 0      512                      127.0.0.1:3000       0.0.0.0:*    users:(("bun",pid=3190643,fd=10))        
LISTEN 0      511                      127.0.0.1:44379      0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=24))
LISTEN 0      4096                     127.0.0.1:19514      0.0.0.0:*    users:(("multica",pid=3624,fd=6))        
LISTEN 0      4096                 127.0.0.53%lo:53         0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:17680      0.0.0.0:*    users:(("agentosd",pid=3953816,fd=6))    
LISTEN 0      4096                     127.0.0.1:2019       0.0.0.0:*                                             
LISTEN 0      5                        127.0.0.1:18080      0.0.0.0:*    users:(("python3",pid=3953829,fd=3))     
LISTEN 0      4096                     127.0.0.1:39163      0.0.0.0:*                                             
LISTEN 0      4096                       0.0.0.0:22         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:6767       0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=25))
LISTEN 0      4096                     127.0.0.1:8080       0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:8090       0.0.0.0:*                                             
LISTEN 0      4096                    127.0.0.54:53         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:5173       0.0.0.0:*    users:(("MainThread",pid=3136795,fd=21)) 
LISTEN 0      4096                 100.99.181.23:62289      0.0.0.0:*                                             
LISTEN 0      4096   [fd7a:115c:a1e0::c534:b518]:55029         [::]:*                                             
LISTEN 0      4096                          [::]:22            [::]:*                                             
LISTEN 0      4096                             *:80               *:*                                             
$ node scripts/native-smoke.js
READY
$ curl -i --max-time 5 http://127.0.0.1:18721/hello
  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed

  0      0   0      0   0      0      0      0                              0
100     35 100     35   0      0  18786      0                              0
100     35 100     35   0      0  17552      0                              0
100     35 100     35   0      0  16924      0                              0
HTTP/1.1 200 OK
content-length: 35
content-type: text/plain; charset=utf-8
date: Mon, 14 Sep 2026 08:22:54 GMT

fixed response from Rust on compio
stats { runtime: 'compio', requests: 1, workers: 1, inFlight: 0 }
STOPPED
Node exited naturally after stop: code=0
```

$ `cargo tree -e normal | grep -c tokio`

```text
0
```

$ `cargo tree -i compio-runtime`

```text
compio-runtime v0.11.0
├── compio-net v0.11.1
│   └── ntex-net v3.15.0
│       ├── ntex v3.12.3
│       │   └── ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
│       ├── ntex-h2 v3.13.0
│       │   └── ntex v3.12.3 (*)
│       ├── ntex-server v3.11.2
│       │   ├── ntex v3.12.3 (*)
│       │   └── ntex-h2 v3.13.0 (*)
│       └── ntex-tls v3.8.0
│           └── ntex v3.12.3 (*)
├── ntex-net v3.15.0 (*)
└── ntex-rt v3.17.2
    ├── ntex v3.12.3 (*)
    ├── ntex-io v3.13.1
    │   ├── ntex v3.12.3 (*)
    │   ├── ntex-dispatcher v3.2.1
    │   │   ├── ntex v3.12.3 (*)
    │   │   └── ntex-h2 v3.13.0 (*)
    │   ├── ntex-h2 v3.13.0 (*)
    │   ├── ntex-net v3.15.0 (*)
    │   ├── ntex-server v3.11.2 (*)
    │   └── ntex-tls v3.8.0 (*)
    ├── ntex-net v3.15.0 (*)
    ├── ntex-server v3.11.2 (*)
    └── ntex-util v3.6.1
        ├── ntex v3.12.3 (*)
        ├── ntex-dispatcher v3.2.1 (*)
        ├── ntex-h2 v3.13.0 (*)
        ├── ntex-io v3.13.1 (*)
        ├── ntex-net v3.15.0 (*)
        ├── ntex-server v3.11.2 (*)
        └── ntex-tls v3.8.0 (*)
```


## M3 — async Rust/JS response bridge

$ `sh scripts/build.sh`

```text
   Compiling ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `release` profile [optimized] target(s) in 4.91s
```

$ `python3 scripts/native-smoke.py m3`

```text
$ ss -ltnp
State  Recv-Q Send-Q               Local Address:Port  Peer Address:PortProcess                                   
LISTEN 0      512                      127.0.0.1:3000       0.0.0.0:*    users:(("bun",pid=3190643,fd=10))        
LISTEN 0      511                      127.0.0.1:44379      0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=24))
LISTEN 0      4096                     127.0.0.1:19514      0.0.0.0:*    users:(("multica",pid=3624,fd=6))        
LISTEN 0      4096                 127.0.0.53%lo:53         0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:17680      0.0.0.0:*    users:(("agentosd",pid=3953816,fd=6))    
LISTEN 0      4096                     127.0.0.1:2019       0.0.0.0:*                                             
LISTEN 0      5                        127.0.0.1:18080      0.0.0.0:*    users:(("python3",pid=3953829,fd=3))     
LISTEN 0      4096                     127.0.0.1:39163      0.0.0.0:*                                             
LISTEN 0      4096                       0.0.0.0:22         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:6767       0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=25))
LISTEN 0      4096                     127.0.0.1:8080       0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:8090       0.0.0.0:*                                             
LISTEN 0      4096                    127.0.0.54:53         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:5173       0.0.0.0:*    users:(("MainThread",pid=3136795,fd=21)) 
LISTEN 0      4096                 100.99.181.23:62289      0.0.0.0:*                                             
LISTEN 0      4096   [fd7a:115c:a1e0::c534:b518]:55029         [::]:*                                             
LISTEN 0      4096                          [::]:22            [::]:*                                             
LISTEN 0      4096                             *:80               *:*                                             
$ node scripts/native-smoke.js
READY
$ curl -i --max-time 5 http://127.0.0.1:18721/hello
  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed

  0      0   0      0   0      0      0      0                              0
100     33 100     33   0      0  11232      0                              0
100     33 100     33   0      0   9537      0                              0
100     33 100     33   0      0   9345      0                              0
HTTP/1.1 200 OK
content-length: 33
content-type: text/plain
date: Mon, 14 Sep 2026 08:24:45 GMT

hello from JavaScript via compio
dispatch isMainThread=true threadId=0 GET /hello
stats {
  runtime: 'compio',
  requests: 1,
  workers: 1,
  inFlight: 0,
  timedOut: 0
}
STOPPED
Node exited naturally after stop: code=0
```


## M4 — every demo route over real HTTP

$ `python3 scripts/demo-smoke.py`

```text
$ ss -ltnp
State  Recv-Q Send-Q               Local Address:Port  Peer Address:PortProcess                                   
LISTEN 0      512                      127.0.0.1:3000       0.0.0.0:*    users:(("bun",pid=3190643,fd=10))        
LISTEN 0      511                      127.0.0.1:44379      0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=24))
LISTEN 0      4096                     127.0.0.1:19514      0.0.0.0:*    users:(("multica",pid=3624,fd=6))        
LISTEN 0      4096                 127.0.0.53%lo:53         0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:17680      0.0.0.0:*    users:(("agentosd",pid=3953816,fd=6))    
LISTEN 0      4096                     127.0.0.1:2019       0.0.0.0:*                                             
LISTEN 0      5                        127.0.0.1:18080      0.0.0.0:*    users:(("python3",pid=3953829,fd=3))     
LISTEN 0      4096                     127.0.0.1:39163      0.0.0.0:*                                             
LISTEN 0      4096                       0.0.0.0:22         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:6767       0.0.0.0:*    users:(("Paseo Daemon",pid=563665,fd=25))
LISTEN 0      4096                     127.0.0.1:8080       0.0.0.0:*                                             
LISTEN 0      4096                     127.0.0.1:8090       0.0.0.0:*                                             
LISTEN 0      4096                    127.0.0.54:53         0.0.0.0:*                                             
LISTEN 0      511                      127.0.0.1:5173       0.0.0.0:*    users:(("MainThread",pid=3136795,fd=21)) 
LISTEN 0      4096                 100.99.181.23:62289      0.0.0.0:*                                             
LISTEN 0      4096   [fd7a:115c:a1e0::c534:b518]:55029         [::]:*                                             
LISTEN 0      4096                          [::]:22            [::]:*                                             
LISTEN 0      4096                             *:80               *:*                                             
$ node examples/demo.js
READY: listening on 18731
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/hello
HTTP/1.1 200 OK
content-length: 11
content-type: text/html; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

Hello World
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/users/alice
HTTP/1.1 200 OK
content-length: 14
content-type: application/json; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

{"id":"alice"}
$ curl -sS -i --max-time 5 -X POST --data-binary 'hello body' http://127.0.0.1:18731/echo
HTTP/1.1 200 OK
content-length: 20
content-type: application/json; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

{"got":"hello body"}
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/optional
HTTP/1.1 200 OK
content-length: 16
content-type: application/json; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

{"name":"world"}
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/optional/Ada
HTTP/1.1 200 OK
content-length: 14
content-type: application/json; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

{"name":"Ada"}
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/files/a/b.txt
HTTP/1.1 200 OK
content-length: 7
content-type: text/html; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

a/b.txt
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/missing
HTTP/1.1 404 Not Found
content-length: 19
content-type: text/plain; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

Cannot GET /missing
$ curl -sS -i --max-time 5 http://127.0.0.1:18731/fail
HTTP/1.1 500 Internal Server Error
content-length: 24
content-type: application/json; charset=utf-8
x-powered-by: ntex-compio-neon
date: Mon, 14 Sep 2026 08:26:50 GMT

{"error":"demo failure"}
GET /hello
GET /users/alice
POST /echo
GET /optional
GET /optional/Ada
GET /files/a/b.txt
GET /missing
GET /fail
CLOSED {
  runtime: 'compio',
  requests: 8,
  workers: 1,
  inFlight: 0,
  timedOut: 0
}
Node exited naturally: code=0
```


## M5 — final hardening gate

$ `sh scripts/build.sh`

```text
   Compiling ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `release` profile [optimized] target(s) in 5.69s
```

$ `cargo clippy --all-targets -- -D warnings`

```text
    Checking ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.52s
```

$ `node --test test/*.test.js`

```text
ss -H -ltn checked: port 18901 is free
ss -H -ltn checked: port 18902 is free
✔ Express-shaped API over real HTTP sockets (584.662308ms)
ASSERT sync/async exceptions and next(err) -> 500, no timeout or hang
ss -H -ltn checked: port 18911 is free
✔ throws, rejections, next(err), error middleware and defaults (464.425848ms)
ASSERT workers=1: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 1,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18912 is free
✔ compio workers=1: 80 concurrent distinct binary requests (504.365858ms)
ASSERT workers=2: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 2,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18914 is free
✔ compio workers=2: 80 concurrent distinct binary requests (524.469356ms)
ASSERT workers=4: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 4,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18921 is free
✔ compio workers=4: 80 concurrent distinct binary requests (485.333211ms)
ASSERT unanswered handlers -> 504; late reply ignored; next request succeeds; {
  runtime: 'compio',
  requests: 3,
  workers: 1,
  inFlight: 0,
  timedOut: 2
}
ss -H -ltn checked: port 18930 is free
✔ never responding times out; late responses cannot consume a later request (742.836904ms)
ss -H -ltn checked: port 18931 is free
ss checked: intentionally testing our occupied port 18931
ss -H -ltn checked: port 18930 is free
ASSERT startup failure rejects and releases roots/channel; restart succeeds; stale IDs rejected
✔ native validation, dispatch exceptions, duplicate response, bind failure and restart (911.374075ms)
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=drain status=200 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":0}
ASSERT process-exit drain: child exit code 0, no signal, within 7s watchdog
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=timeout status=504 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":1}
ASSERT process-exit timeout: child exit code 0, no signal, within 7s watchdog
✔ app.close drains active requests and Node exits without process.exit (1241.706603ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 5638.708301
```

$ `realpath index.node; file index.node; node -e "const n = require('./index.node'); console.log(Object.keys(n)); console.log(n.stats())"`

```text
/home/akrc/Developer/ntex-compio-napi/index.node
index.node: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, BuildID[sha1]=9c40dab30d6318da6fe6e2e9036bdaea88bdf251, not stripped
[ 'start', 'respond', 'stop', 'stats' ]
{
  runtime: 'compio',
  requests: 0,
  workers: 0,
  inFlight: 0,
  timedOut: 0
}
```

$ `cargo tree -e normal | grep -c tokio`

```text
0
```

$ `cargo tree -i compio-runtime`

```text
compio-runtime v0.11.0
├── compio-net v0.11.1
│   └── ntex-net v3.15.0
│       ├── ntex v3.12.3
│       │   └── ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
│       ├── ntex-h2 v3.13.0
│       │   └── ntex v3.12.3 (*)
│       ├── ntex-server v3.11.2
│       │   ├── ntex v3.12.3 (*)
│       │   └── ntex-h2 v3.13.0 (*)
│       └── ntex-tls v3.8.0
│           └── ntex v3.12.3 (*)
├── ntex-net v3.15.0 (*)
└── ntex-rt v3.17.2
    ├── ntex v3.12.3 (*)
    ├── ntex-io v3.13.1
    │   ├── ntex v3.12.3 (*)
    │   ├── ntex-dispatcher v3.2.1
    │   │   ├── ntex v3.12.3 (*)
    │   │   └── ntex-h2 v3.13.0 (*)
    │   ├── ntex-h2 v3.13.0 (*)
    │   ├── ntex-net v3.15.0 (*)
    │   ├── ntex-server v3.11.2 (*)
    │   └── ntex-tls v3.8.0 (*)
    ├── ntex-net v3.15.0 (*)
    ├── ntex-server v3.11.2 (*)
    └── ntex-util v3.6.1
        ├── ntex v3.12.3 (*)
        ├── ntex-dispatcher v3.2.1 (*)
        ├── ntex-h2 v3.13.0 (*)
        ├── ntex-io v3.13.1 (*)
        ├── ntex-net v3.15.0 (*)
        ├── ntex-server v3.11.2 (*)
        └── ntex-tls v3.8.0 (*)
```


## Development finding — original test failure, corrected before final gate

$ `node --test test/*.test.js (first hardening run)`

```text
ss -H -ltn checked: port 18901 is free
ss -H -ltn checked: port 18902 is free
✖ Express-shaped API over real HTTP sockets (561.044394ms)
ASSERT sync/async exceptions and next(err) -> 500, no timeout or hang
ss -H -ltn checked: port 18911 is free
✔ throws, rejections, next(err), error middleware and defaults (447.248335ms)
ASSERT workers=1: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 1,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18912 is free
✔ compio workers=1: 80 concurrent distinct binary requests (493.156783ms)
ASSERT workers=2: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 2,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18914 is free
✔ compio workers=2: 80 concurrent distinct binary requests (472.830156ms)
ASSERT workers=4: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 4,
  inFlight: 0,
  timedOut: 0
}
ss -H -ltn checked: port 18921 is free
✔ compio workers=4: 80 concurrent distinct binary requests (470.921527ms)
ASSERT unanswered handlers -> 504; late reply ignored; next request succeeds; {
  runtime: 'compio',
  requests: 3,
  workers: 1,
  inFlight: 0,
  timedOut: 2
}
ss -H -ltn checked: port 18930 is free
✔ never responding times out; late responses cannot consume a later request (733.389979ms)
ss -H -ltn checked: port 18931 is free
ss checked: intentionally testing our occupied port 18931
ss -H -ltn checked: port 18930 is free
ASSERT startup failure rejects and releases roots/channel; restart succeeds; stale IDs rejected
✔ native validation, dispatch exceptions, duplicate response, bind failure and restart (906.668761ms)
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=drain status=200 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":0}
ASSERT process-exit drain: child exit code 0, no signal, within 7s watchdog
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=timeout status=504 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":1}
ASSERT process-exit timeout: child exit code 0, no signal, within 7s watchdog
✔ app.close drains active requests and Node exits without process.exit (1182.003195ms)
ℹ tests 8
ℹ suites 0
ℹ pass 7
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 5412.526698

✖ failing tests:

test at test/integration.test.js:20:1
✖ Express-shaped API over real HTTP sockets (561.044394ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + "I'm a Teapot"
  - "I'm a teapot"
           ^
  
      at TestContext.<anonymous> (/home/akrc/Developer/ntex-compio-napi/test/integration.test.js:93:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1404:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: "I'm a Teapot",
    expected: "I'm a teapot",
    operator: 'strictEqual',
    diff: 'simple'
  }
```


## Follow-up — request body and admission limits (final gate)

$ `sh scripts/build.sh`

```text
   Compiling ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `release` profile [optimized] target(s) in 6.33s
```

$ `npm test`

```text

> ntex-compio-napi@0.1.0 test
> node --test test/*.test.js

ss -H -ltn checked: port 18901 is free
ss -H -ltn checked: port 18902 is free
✔ Express-shaped API over real HTTP sockets (610.544763ms)
ASSERT sync/async exceptions and next(err) -> 500, no timeout or hang
ss -H -ltn checked: port 18911 is free
✔ throws, rejections, next(err), error middleware and defaults (440.100923ms)
ASSERT workers=1: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 1,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18912 is free
✔ compio workers=1: 80 concurrent distinct binary requests (487.518467ms)
ASSERT workers=2: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 2,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18914 is free
✔ compio workers=2: 80 concurrent distinct binary requests (483.576084ms)
ASSERT workers=4: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 4,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18921 is free
✔ compio workers=4: 80 concurrent distinct binary requests (476.194984ms)
ASSERT unanswered handlers -> 504; late reply ignored; next request succeeds; {
  runtime: 'compio',
  requests: 3,
  workers: 1,
  inFlight: 0,
  timedOut: 2,
  peakInFlight: 1,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18930 is free
✔ never responding times out; late responses cannot consume a later request (730.81026ms)
ss -H -ltn checked: port 18931 is free
ss checked: intentionally testing our occupied port 18931
ss -H -ltn checked: port 18930 is free
ASSERT startup failure rejects and releases roots/channel; restart succeeds; stale IDs rejected
✔ native validation, dispatch exceptions, duplicate response, bind failure and restart (865.741877ms)
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=drain status=200 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ASSERT process-exit drain: child exit code 0, no signal, within 7s watchdog
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=timeout status=504 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":1,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ASSERT process-exit timeout: child exit code 0, no signal, within 7s watchdog
✔ app.close drains active requests and Node exits without process.exit (1411.812557ms)
ss -H -ltn checked: port 19001 is free
DEFAULT LIMITS {"runtime":"compio","requests":0,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":0,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19001 is free
ss -H -ltn checked: port 19002 is free
✔ limit validation and configured defaults (844.971682ms)
BODY CAP dispatch=3 (accepted only) {"runtime":"compio","requests":6,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":16,"maxInFlight":1,"maxQueued":0,"rejected413":3,"rejected503":0}
ss -H -ltn checked: port 19003 is free
✔ 413: Content-Length precheck, exact cap, cap+1, incomplete chunked upload, fresh connections (459.438192ms)
OVERSIZED N=32 cap=65536 RSS_before_bytes=61853696 RSS_after_bytes=68497408 RSS_delta_bytes=6643712
OVERSIZED STATS {"runtime":"compio","requests":33,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":32,"queued":0,"maxBodyBytes":65536,"maxInFlight":32,"maxQueued":0,"rejected413":32,"rejected503":0}
ss -H -ltn checked: port 19011 is free
✔ 64 KiB cap: concurrent oversized uploads and measured RSS (471.52802ms)
ADMISSION SATURATED workers=1 {"runtime":"compio","requests":12,"workers":1,"inFlight":4,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ADMISSION workers=1 dispatch=4 {"runtime":"compio","requests":12,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ss -H -ltn checked: port 19012 is free
✔ admission workers=1: 4 dispatched, 8 refused, gate release (424.405045ms)
ADMISSION SATURATED workers=2 {"runtime":"compio","requests":12,"workers":2,"inFlight":4,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ADMISSION workers=2 dispatch=4 {"runtime":"compio","requests":12,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ss -H -ltn checked: port 19020 is free
✔ admission workers=2: 4 dispatched, 8 refused, gate release (407.313933ms)
QUEUE SATURATED {"runtime":"compio","requests":4,"workers":2,"inFlight":1,"timedOut":0,"peakInFlight":1,"queued":2,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":2,"rejected413":0,"rejected503":1}
QUEUE FIFO + queued disconnect {"runtime":"compio","requests":5,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":2,"rejected413":0,"rejected503":1}
ss -H -ltn checked: port 19021 is free
✔ bounded queue, queued disconnect, FIFO transfer and recovery (457.613835ms)
DISCONNECT active + upload, no timeout {"runtime":"compio","requests":4,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19021 is free
TIMEOUT slot recovered {"runtime":"compio","requests":2,"workers":1,"inFlight":0,"timedOut":1,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19022 is free
✔ slot release: timeout, late reply, active disconnect and upload disconnect (1006.106123ms)
THROW + graceful shutdown {"runtime":"compio","requests":4,"workers":1,"inFlight":0,"timedOut":2,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":1,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19023 is free
✔ native dispatch throw and shutdown release active and queued slots (749.105043ms)
PRE-UPLOAD ADMISSION + 413 precedence {"runtime":"compio","requests":4,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":16,"maxInFlight":1,"maxQueued":1,"rejected413":1,"rejected503":1}
ss -H -ltn checked: port 19023 is free
TIMEOUT transfers queued slot {"runtime":"compio","requests":2,"workers":1,"inFlight":0,"timedOut":1,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":1,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19024 is free
✔ admission happens before upload; header cap takes precedence; queued timeout transfer (994.791075ms)
FORCED SHUTDOWN socketsClosed=2 dispatch=0 {"runtime":"compio","requests":2,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":1,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19024 is free
ss -H -ltn checked: port 19026 is free
✔ shutdown budget cancels a stalled upload and queued request, closes sockets, permits restart (3019.097136ms)
BUSY JS expiredDispatch=0 recoveredDispatch=1 {"runtime":"compio","requests":13,"workers":1,"inFlight":0,"timedOut":12,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":0,"rejected413":0,"rejected503":0}
✔ busy JS: expired requests never dispatch, capacity recovers across repeated timeouts (942.174235ms)
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9935.567729
```

$ `cargo clippy --all-targets -- -D warnings`

```text
    Checking ntex-compio-napi v0.1.0 (/home/akrc/Developer/ntex-compio-napi)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.76s
```

$ `cargo fmt --check`

```text
```

$ `cargo tree -e normal | grep -c tokio`

```text
0
```

The RSS lines measure the Node process containing both the native server and the HTTP test clients. They are before/after samples, not a peak-RSS measurement or a long-run memory bound. Each test start resets the counters; the saturated and completed admission snapshots show the same run before and after gate release. The tests assert the high-water mark never exceeds the configured capacity.

The header-over-cap test deliberately sends no body. The chunked refusal test separates writes and never sends the terminating chunk, proving refusal does not await upload completion. Native dispatch and façade middleware counters remain unchanged for refused requests. The original concurrency tests retain their behavior and expand only their exact expected stats object for the required additive fields.

Source inspection of the pinned HTTP service found that its shutdown notification can already be resolved after an earlier idle period. The first queue/shutdown regression below timed out at the HTTP client; the final gate above covers explicit bridge draining after that idle period and forced shutdown of a stalled upload plus a queued request. The initial failure is retained without altering its output. Formatting passed with empty output; the no-tokio grep has its expected no-match exit status.

## Follow-up development finding — first shutdown regression, corrected before final gate

$ `npm test (first limit run)`

```text

> ntex-compio-napi@0.1.0 test
> node --test test/*.test.js

ss -H -ltn checked: port 18901 is free
ss -H -ltn checked: port 18902 is free
✔ Express-shaped API over real HTTP sockets (589.867127ms)
ASSERT sync/async exceptions and next(err) -> 500, no timeout or hang
ss -H -ltn checked: port 18911 is free
✔ throws, rejections, next(err), error middleware and defaults (442.224868ms)
ASSERT workers=1: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 1,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18912 is free
✔ compio workers=1: 80 concurrent distinct binary requests (501.94927ms)
ASSERT workers=2: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 2,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18914 is free
✔ compio workers=2: 80 concurrent distinct binary requests (454.814587ms)
ASSERT workers=4: 80/80 byte-exact replies; zero misroutes, drops or timeouts; all 80 reached JS before replies
stats() {
  runtime: 'compio',
  requests: 80,
  workers: 4,
  inFlight: 0,
  timedOut: 0,
  peakInFlight: 80,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18921 is free
✔ compio workers=4: 80 concurrent distinct binary requests (483.241634ms)
ASSERT unanswered handlers -> 504; late reply ignored; next request succeeds; {
  runtime: 'compio',
  requests: 3,
  workers: 1,
  inFlight: 0,
  timedOut: 2,
  peakInFlight: 1,
  queued: 0,
  maxBodyBytes: 1048576,
  maxInFlight: 1024,
  maxQueued: 0,
  rejected413: 0,
  rejected503: 0
}
ss -H -ltn checked: port 18930 is free
✔ never responding times out; late responses cannot consume a later request (739.864069ms)
ss -H -ltn checked: port 18931 is free
ss checked: intentionally testing our occupied port 18931
ss -H -ltn checked: port 18930 is free
ASSERT startup failure rejects and releases roots/channel; restart succeeds; stale IDs rejected
✔ native validation, dispatch exceptions, duplicate response, bind failure and restart (876.806218ms)
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=drain status=200 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ASSERT process-exit drain: child exit code 0, no signal, within 7s watchdog
ss -H -ltn checked: port 18951 is free
EXIT PROOF mode=timeout status=504 callback=true stats={"runtime":"compio","requests":1,"workers":1,"inFlight":0,"timedOut":1,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ASSERT process-exit timeout: child exit code 0, no signal, within 7s watchdog
✔ app.close drains active requests and Node exits without process.exit (1208.566731ms)
ss -H -ltn checked: port 19001 is free
DEFAULT LIMITS {"runtime":"compio","requests":0,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":0,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1024,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19001 is free
ss -H -ltn checked: port 19002 is free
✔ limit validation and configured defaults (827.823859ms)
BODY CAP dispatch=3 (accepted only) {"runtime":"compio","requests":6,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":16,"maxInFlight":1,"maxQueued":0,"rejected413":3,"rejected503":0}
ss -H -ltn checked: port 19003 is free
✔ 413: Content-Length precheck, exact cap, cap+1, incomplete chunked upload, fresh connections (436.041336ms)
OVERSIZED N=32 cap=65536 RSS_before_bytes=61554688 RSS_after_bytes=68280320 RSS_delta_bytes=6725632
OVERSIZED STATS {"runtime":"compio","requests":33,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":23,"queued":0,"maxBodyBytes":65536,"maxInFlight":32,"maxQueued":0,"rejected413":32,"rejected503":0}
ss -H -ltn checked: port 19011 is free
✔ 64 KiB cap: concurrent oversized uploads and measured RSS (471.053611ms)
ADMISSION workers=1 dispatch=4 {"runtime":"compio","requests":12,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ss -H -ltn checked: port 19012 is free
✔ admission workers=1: 4 dispatched, 8 refused, gate release (418.854704ms)
ADMISSION workers=2 dispatch=4 {"runtime":"compio","requests":12,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":4,"queued":0,"maxBodyBytes":1048576,"maxInFlight":4,"maxQueued":0,"rejected413":0,"rejected503":8}
ss -H -ltn checked: port 19020 is free
✔ admission workers=2: 4 dispatched, 8 refused, gate release (424.309428ms)
QUEUE FIFO + queued disconnect {"runtime":"compio","requests":5,"workers":2,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":2,"rejected413":0,"rejected503":1}
ss -H -ltn checked: port 19021 is free
✔ bounded queue, queued disconnect, FIFO transfer and recovery (439.188278ms)
DISCONNECT active + upload, no timeout {"runtime":"compio","requests":4,"workers":1,"inFlight":0,"timedOut":0,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19021 is free
TIMEOUT slot recovered {"runtime":"compio","requests":2,"workers":1,"inFlight":0,"timedOut":1,"peakInFlight":1,"queued":0,"maxBodyBytes":1048576,"maxInFlight":1,"maxQueued":0,"rejected413":0,"rejected503":0}
ss -H -ltn checked: port 19022 is free
✔ slot release: timeout, late reply, active disconnect, body disconnect and payload error (1023.229932ms)
✖ native dispatch throw and shutdown release active and queued slots (6072.39967ms)
ℹ Error: Test "native dispatch throw and shutdown release active and queued slots" at test/limits.test.js:203:1 generated asynchronous activity after the test ended. This activity created the error "Error: HTTP timeout: GET /queued" and would have caused the test to fail, but instead triggered an unhandledRejection event.
ℹ tests 16
ℹ suites 0
ℹ pass 15
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10301.072411

✖ failing tests:

test at test/limits.test.js:203:1
✖ native dispatch throw and shutdown release active and queued slots (6072.39967ms)
  Error: HTTP timeout: GET /never
      at ClientRequest.<anonymous> (/home/akrc/Developer/ntex-compio-napi/test/helpers.js:19:44)
      at ClientRequest.wrapper (node:events:639:12)
      at ClientRequest.emit (node:events:514:28)
      at Socket.emitRequestTimeout (node:_http_client:1122:9)
      at Socket.wrapper (node:events:639:12)
      at Socket.emit (node:events:526:24)
      at Socket._onTimeout (node:net:822:8)
      at Timeout.onStreamTimeout [as _onTimeout] (node:internal/stream_base_commons:237:10)
      at listOnTimeout (node:internal/timers:687:11)
      at process.processTimers (node:internal/timers:618:7)
npm notice
npm notice New major version of npm available! 11.19.0 -> 12.0.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
npm notice To update run: npm install -g npm@12.0.2
npm notice
```

