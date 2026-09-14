#!/bin/sh
set -eu
. ./scripts/env.sh
cargo build --release
cp target/release/libntex_compio_napi.so index.node
