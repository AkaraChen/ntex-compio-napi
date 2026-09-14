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

