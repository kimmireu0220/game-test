# E2E 확인 (Playwright)

WordPress에 올린 게임·페이지를 Playwright로 열어 동작을 확인합니다.  
수정 후 `run_all.py` 또는 개별 체크를 실행해 반영 여부를 검증할 수 있습니다.

## 준비

- Python 3 + 가상환경(프로젝트 루트 `.venv` 권장)
- Playwright: `pip install playwright` 후 `playwright install chromium`
- `.env`에 `WP_URL` 등 설정(게임 업로드와 동일)

## 실행

**전체 확인** (프로젝트 루트에서):

```bash
.venv/bin/python e2e/run_all.py
```

**2048만 확인**:

```bash
.venv/bin/python e2e/checks/check_2048.py
```

스크린샷은 `e2e/screenshots/`에 저장됩니다.

## 체크 추가

새 게임/페이지 확인이 필요하면 `e2e/checks/` 아래에 `check_<이름>.py`를 추가하고,  
`e2e/run_all.py`의 `CHECKS` 리스트에 등록하면 됩니다.
