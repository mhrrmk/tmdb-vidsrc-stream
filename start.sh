#!/bin/bash

cd "$(dirname "$0")"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing dependencies with bun..."
bun install

echo "Starting TMDB Proxy Server..."
bun run server.js &
SERVER_PID=$!

sleep 2

echo "Opening tmdb-viewer in browser..."
open "http://localhost:${PORT}/viewer"

echo "Server running on http://localhost:8080"
echo "Press Ctrl+C to stop the server"

trap "kill $SERVER_PID" EXIT

wait
