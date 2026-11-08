#!/bin/bash
# Start / stop / restart the packaged OWASP Juice Shop (restart re-seeds its database).
cd "$(dirname "$0")"
APP_DIR="$(cat juice-app.path 2>/dev/null)"
NODE_BIN="$(cat juice-node.path 2>/dev/null || command -v node)"
port_busy () { lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; }
case "$1" in
  start)
    if [ -f juice.pid ] && kill -0 "$(cat juice.pid)" 2>/dev/null; then exit 0; fi
    [ -d "$APP_DIR" ] || { echo "juice app dir missing: $APP_DIR"; exit 1; }
    for i in $(seq 40); do port_busy || break; sleep 0.5; done
    ( cd "$APP_DIR" && nohup "$NODE_BIN" build/app.js >> "$OLDPWD/results/juice.log" 2>&1 & echo $! > "$OLDPWD/juice.pid" )
    ;;
  stop)
    if [ -f juice.pid ]; then
      P="$(cat juice.pid)"
      kill "$P" 2>/dev/null
      for i in $(seq 40); do kill -0 "$P" 2>/dev/null || break; sleep 0.25; done
      kill -9 "$P" 2>/dev/null
      rm -f juice.pid
    fi
    # anything else still listening on :3000 that is a Juice Shop node process from this folder
    for P in $(lsof -nP -t -iTCP:3000 -sTCP:LISTEN 2>/dev/null); do
      ps -o command= -p "$P" | grep -q "build/app.js" && kill -9 "$P" 2>/dev/null
    done
    for i in $(seq 40); do port_busy || break; sleep 0.25; done
    ;;
  restart)
    bash "$0" stop; bash "$0" start
    ;;
esac
