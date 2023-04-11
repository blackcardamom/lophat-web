#!/bin/bash
# Get prereqs
toolchain=$(cat ./rust-toolchain)
rustup toolchain install $toolchain
rustup component add rust-src --toolchain $toolchain
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
# Build the project for release
wasm-pack build --release --target web
cd www
npm install
npm run build
