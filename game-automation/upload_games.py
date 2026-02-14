"""
content/games/ 의 HTML 파일을 manifest.json 기준으로 WordPress 게임 페이지로 업로드합니다.
HTML에서 <link rel="stylesheet" href="...">, <script src="...">는 같은 폴더의 파일로 인라인됩니다.

WordPress가 본문에서 <style>/<script>를 제거하거나 실행하지 않는 경우를 위해
기본값으로 iframe + data URL 방식을 사용합니다 (전체 게임 HTML을 iframe에 넣어 실행).

실행 (프로젝트 루트에서):
  python game-automation/upload_games.py
"""

import base64
import json
import os
import re
import sys

_script_dir = os.path.dirname(os.path.abspath(__file__))
if _script_dir not in sys.path:
    sys.path.insert(0, _script_dir)

import paths
import wordpress_client

MANIFEST_PATH = os.path.join(paths.GAMES_DIR, "manifest.json")


def _inline_assets(html_content, html_path):
    """HTML 내 상대 경로 link/script를 같은 폴더 파일 내용으로 인라인한다."""
    base_dir = os.path.dirname(html_path)

    def replace_link(match):
        href = match.group(1).strip()
        if href.startswith("http") or href.startswith("//"):
            return match.group(0)
        file_path = os.path.join(base_dir, href)
        if not os.path.isfile(file_path):
            return match.group(0)
        with open(file_path, "r", encoding="utf-8") as f:
            return "<style>\n" + f.read() + "\n</style>"

    def replace_script(match):
        src = match.group(1).strip()
        if src.startswith("http") or src.startswith("//"):
            return match.group(0)
        file_path = os.path.join(base_dir, src)
        if not os.path.isfile(file_path):
            return match.group(0)
        with open(file_path, "r", encoding="utf-8") as f:
            return "<script>\n" + f.read() + "\n</script>"

    html_content = re.sub(
        r'<link\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>',
        replace_link,
        html_content,
        flags=re.IGNORECASE,
    )
    html_content = re.sub(
        r'<script\s+src=["\']([^"\']+)["\'][^>]*>\s*</script>',
        replace_script,
        html_content,
        flags=re.IGNORECASE,
    )
    return html_content


def _body_fragment(html_content):
    """전체 HTML에서 body 내부만 추출해 단일 루트 div로 감싼다."""
    match = re.search(r"<body[^>]*>(.*)</body>", html_content, re.DOTALL | re.IGNORECASE)
    if not match:
        return html_content
    inner = match.group(1).strip()
    return '<div class="game-page-wrapper">\n' + inner + "\n</div>"


def _wrap_in_iframe(full_html, title):
    """전체 HTML을 data URL로 넣은 iframe만 WordPress에 전송한다.
    WP가 style/script를 제거해도 iframe 안에서는 그대로 실행된다.
    """
    b64 = base64.b64encode(full_html.encode("utf-8")).decode("ascii")
    src = f"data:text/html;charset=utf-8;base64,{b64}"
    return (
        '<div class="game-iframe-wrap" style="min-height:520px;">'
        f'<iframe src="{src}" style="width:100%;height:520px;border:0;" '
        f'title="{title.replace(chr(34), "&quot;")}"></iframe></div>'
    )


def main():
    """manifest.json에 등록된 게임 HTML을 WordPress에 업로드한다."""
    print("=" * 50)
    print("🎮 게임 업로드")
    print("=" * 50)

    if not wordpress_client.check_connection():
        return

    if not os.path.isfile(MANIFEST_PATH):
        print(f"⚠️  manifest 없음: {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        games = json.load(f)

    if not isinstance(games, list):
        print("⚠️  manifest는 배열이어야 합니다.")
        return

    success = 0
    for i, item in enumerate(games, 1):
        file_name = item.get("file")
        title = item.get("title")
        slug = item.get("slug")
        if not file_name or not title or not slug:
            print(f"⚠️  [{i}] file/title/slug 누락: {item}")
            continue

        path = os.path.join(paths.GAMES_DIR, file_name)
        if not os.path.isfile(path):
            print(f"⚠️  [{i}] 파일 없음: {path}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            full_html = f.read()
        full_html = _inline_assets(full_html, path)
        # iframe + data URL: WP가 style/script를 제거해도 iframe 안에서 실행됨
        content = _wrap_in_iframe(full_html, title)

        print(f"\n[{i}/{len(games)}] {title} (/{slug})")
        url = wordpress_client.publish_game_page(title, slug, content)
        if url:
            success += 1

    print("\n" + "=" * 50)
    print(f"✅ 완료: {success}/{len(games)}개")
    print("=" * 50)


if __name__ == "__main__":
    main()
