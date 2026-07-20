#!/bin/bash
set -euo pipefail
INSTALLED="$HOME/.codex/codex-dream-skin-studio/scripts/start-dream-skin-macos.sh"
if [ ! -x "$INSTALLED" ]; then
  /usr/bin/osascript -e 'display alert "请先双击 Install Codex Dream Skin.command 完成安装。" as warning' >/dev/null
  exit 1
fi
LABEL="com.opsmind.codex-dream-skin.external-start"
LOG="$HOME/Library/Application Support/CodexDreamSkinStudio/external-start.log"
mkdir -p "$(dirname "$LOG")"
launchctl remove "$LABEL" >/dev/null 2>&1 || true
launchctl submit -l "$LABEL" -o "$LOG" -e "$LOG" -- /bin/bash -lc '
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) launchctl start begin"
  "$HOME/.codex/codex-dream-skin-studio/scripts/start-dream-skin-macos.sh" --restart-existing
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) doctor after start"
  "$HOME/.codex/codex-dream-skin-studio/scripts/doctor-macos.sh"
'
/usr/bin/osascript -e 'display notification "正在通过外部 launchctl job 重启 Codex Dream Skin。" with title "Codex Dream Skin"' >/dev/null 2>&1 || true
