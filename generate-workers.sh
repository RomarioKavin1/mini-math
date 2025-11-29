#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <worker-count>" >&2
  exit 1
fi

COUNT="$1"

# Basic sanity check
if ! [ "$COUNT" -gt 0 ] 2>/dev/null; then
  echo "Error: <worker-count> must be a positive integer" >&2
  exit 1
fi

echo "version: '3.9'"
echo
echo "services:"

for i in $(seq 1 "$COUNT"); do
  cat <<EOF
  n9n-worker-$i:
    build:
      context: .
      dockerfile: ./Dockerfile
    container_name: n9n-worker-$i
    restart: unless-stopped
    env_file:
      - .env
    command: ['node', 'apps/n9n/dist/index.js', 'start-worker', '--name', 'worker$i']
    environment:
      NODE_ENV: \${NODE_ENV:-production}
      ELASTICSEARCH_INDEX: \${ELASTICSEARCH_INDEX:-n9n-worker-$i}

EOF
done