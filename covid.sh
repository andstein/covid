#!/bin/bash

PYTHON=python3.8
SRC=~/covid.git
DST=/var/www/html/covid

set -e

cd "$(dirname "$0")"
mkdir -p covid
cd covid
GIT_DIR="${SRC}" git --work-tree=. checkout -f master

(cd inputs/COVID-19 && git pull)

$PYTHON update.py

npm install
npm run build

cp -R public/* $DST/
