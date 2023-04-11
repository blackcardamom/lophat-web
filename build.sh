#!/bin/bash
# Get prereqs
toolchain=$(cat ./rust-toolchain)
rustup toolchain install $toolchain
rustup component add rust-src --toolchain $toolchain
# Build the project for release
wasm-pack build --release --target web
cd www
npm run build
