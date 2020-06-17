#!/bin/bash

alias node=/Users/andreassteiner/.nvm/versions/node/v12.6.0/bin/node

[ "$(node -v | sed -e's/v\([0-9]*\).*/\1/')" -ge 12 ] || {
  echo -e "\033[31mneed at least Node 12 !!\033[m"
  exit 1
}

cd "$(dirname "$0")"
cd inputs/COVID-19
git pull
cd ../..
python3 update.py
yarn run build
rsync -arvz public/ h3:/var/www/html/covid
