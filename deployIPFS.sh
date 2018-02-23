#!/usr/bin/env bash

rm -rf dist/*
./build.sh
ipfs add -r dist
