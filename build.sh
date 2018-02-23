#!/usr/bin/env bash

mkdir -p dist
cp -rf public/* dist
curl http://localhost:15900/depsblob.js > dist/depsblob.js

