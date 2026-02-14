"""
Playwright로 2048 게임 페이지를 열어 보드·스타일·스크립트가 정상인지 확인합니다.
실행: .venv/bin/python e2e/checks/check_2048.py (프로젝트 루트에서)
"""
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_GAME_AUTOMATION = os.path.join(_ROOT, "game-automation")
if _GAME_AUTOMATION not in sys.path:
    sys.path.insert(0, _GAME_AUTOMATION)

import config
from playwright.sync_api import sync_playwright

URL = config.WP_URL.rstrip("/") + "/2048-game/"
SCREENSHOTS_DIR = os.path.join(_ROOT, "e2e", "screenshots")


def main():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    screenshot_path = os.path.join(SCREENSHOTS_DIR, "2048-page.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(URL, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)
            if page.locator(".game-iframe-wrap iframe").count() > 0:
                try:
                    page.frame_locator(".game-iframe-wrap iframe").locator("#board .cell").first.wait_for(
                        state="visible", timeout=8000
                    )
                except Exception:
                    pass
        except Exception as e:
            print(f"❌ 페이지 접속 실패: {e}")
            print(f"   URL: {URL}")
            print("   (game-test.local이 /etc/hosts 등에 등록돼 있는지 확인하세요)")
            browser.close()
            return

        has_iframe = page.locator(".game-iframe-wrap iframe").count() > 0
        if has_iframe:
            fl = page.frame_locator(".game-iframe-wrap iframe")
            board = fl.locator("#board")
            board_visible = board.count() > 0 and board.first.is_visible()
            cells = fl.locator("#board .cell")
            cell_count = cells.count()
            wrapper_visible = fl.locator(".game-page-wrapper").count() > 0
        else:
            wrapper_visible = page.locator(".game-page-wrapper").count() > 0
            board = page.locator("#board")
            board_visible = board.count() > 0 and board.first.is_visible()
            cells = page.locator("#board .cell")
            cell_count = cells.count()

        title_ok = "2048" in page.title() or page.locator("h1:has-text('2048')").count() > 0
        page.screenshot(path=screenshot_path)
        browser.close()

        print("=" * 50)
        print("🔍 2048 페이지 확인 결과")
        print("=" * 50)
        print(f"URL: {URL}")
        print(f"제목에 2048 포함: {'✅' if title_ok else '❌'}")
        print(f"iframe 방식: {'✅' if has_iframe else '❌'}")
        print(f"iframe 내 .game-page-wrapper: {'✅' if wrapper_visible else '❌'}")
        print(f"iframe 내 #board 노출: {'✅' if board_visible else '❌'}")
        print(f"iframe 내 #board .cell 개수 (16개면 정상): {cell_count}")
        print(f"스크린샷: {os.path.abspath(screenshot_path)}")
        print("=" * 50)
        if title_ok and has_iframe and wrapper_visible and board_visible and cell_count == 16:
            print("✅ iframe 내 보드·스타일·스크립트 정상 동작")
        elif not has_iframe:
            print("⚠️ iframe이 없습니다. upload_games.py가 iframe 방식으로 업로드했는지 확인하세요.")
        else:
            print("⚠️ 일부 항목 미충족 (위 결과 확인)")


if __name__ == "__main__":
    main()
