# 게임 업로드

1. 게임을 **한 폴더**에 넣습니다 (예: `2048/index.html` + `2048/style.css`, `2048/game.js`, `2048/ui.js`).
2. `manifest.json`에 `file`(진입 HTML 경로), `title`, `slug`를 추가합니다.
3. 프로젝트 루트에서 실행: `python game-automation/upload_games.py`

업로드 시 HTML 안의 `<link rel="stylesheet" href="...">`, `<script src="...">`는 **같은 폴더의 파일**로 인라인되어 한 덩어리 HTML로 WordPress에 올라갑니다.

## manifest 예시

```json
[
  { "file": "2048/index.html", "title": "2048 게임", "slug": "2048-game" }
]
```

단일 HTML만 쓸 경우: `{ "file": "mygame.html", "title": "내 게임", "slug": "my-game" }`
