
## M1 — build and load

$ `rustc --version; cargo --version; node --version`

```text
rustc 1.97.1 (8bab26f4f 2026-07-14)
cargo 1.97.1 (c980f4866 2026-06-30)
v24.20.0
```

$ `sh scripts/build.sh (cargo build --release; copy .so to index.node), tail -6`

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

$ `realpath index.node; file index.node; node -e "console.log(require(\x27./index.node\x27).stats())"`

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

