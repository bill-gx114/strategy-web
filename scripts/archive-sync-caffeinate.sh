#!/bin/zsh
set -euo pipefail

duration="${1:-5400}"
logfile="/tmp/com.bytedance.codex.archive-sync-caffeinate.log"

{
  echo "[$(/bin/date '+%Y-%m-%d %H:%M:%S %Z')] starting caffeinate for ${duration}s"
} >> "$logfile"

exec /usr/bin/caffeinate -i -t "$duration"
