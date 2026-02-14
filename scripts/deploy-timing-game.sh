#!/usr/bin/env bash
# 시간 맞추기 게임을 대상 디렉터리(예: WordPress 업로드 경로)로 복사합니다.
# 사용법: ./scripts/deploy-timing-game.sh [대상경로]
# 예:    ./scripts/deploy-timing-game.sh /path/to/wp-content/uploads/2026/02

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GAME_DIR="$REPO_ROOT/content/games/timing-game"
DEST="${1:-}"

if [ -z "$DEST" ]; then
  echo "사용법: $0 <대상경로>"
  echo "예: $0 /path/to/wp-content/uploads/2026/02"
  exit 1
fi

mkdir -p "$DEST"
cp "$GAME_DIR/index.html" "$GAME_DIR/app.js" "$GAME_DIR/style.css" "$GAME_DIR/config.example.js" "$DEST/"
cp "$GAME_DIR/index.html" "$DEST/timing-game.html"
echo "배포 완료: $GAME_DIR -> $DEST"
echo "복사된 파일: index.html, timing-game.html, app.js, style.css, config.example.js"
echo "실제 서비스 시 config.example.js를 config.js로 복사 후 Supabase URL/KEY를 넣어 사용하세요."
