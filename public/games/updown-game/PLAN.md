# 업다운 실시간 레이스 — 구현 계획

## 1. 게임 규칙 (확정)

- **범위**: 1~100 고정. (변경 없음.)
- **서버**가 1~100 중 숫자 하나 정함 (예: 34). 클라이언트에는 비공개.
- **모든 플레이어**가 동시에 맞추기 대결. 턴/라운드 없음.
- 각자 **자기 범위**만 가짐. 처음엔 전부 1~100.
- 플레이어가 숫자 제출 → 서버가 **업 / 다운 / 정답** 중 하나만 해당 플레이어에게 반환.
  - **업**: 제시한 숫자보다 정답이 큼 → 내 범위 `min = 제시+1`
  - **다운**: 제시한 숫자보다 정답이 작음 → 내 범위 `max = 제시-1`
  - **정답**: 해당 플레이어가 **1등**. 게임 종료.
- **가장 먼저 정답을 제출한 사람**이 승자. 나머지는 패자(벌칙은 앱 밖 룰).

---

## 2. 플로우 요약

| 단계 | 화면 | 설명 |
|------|------|------|
| 1 | 닉네임 | 닉네임 입력 → 방 만들기 / 방 들어가기 |
| 2 | 방 만들기 | 방 제목(선택) → 생성 → 6자리 코드 표시 |
| 3 | 방 들어가기 | 6자리 코드 입력 → 입장 |
| 4 | 대기실 | 방 제목, 참가자 목록(**N승** 표시). 호스트만 **시작** 버튼. 나가기 |
| 5 | 게임 중 | 현재 범위(min~max) 표시, 참가자별 **N승** 표시, 숫자 입력+제출. 업/다운/정답 피드백 |
| 6 | 결과 | "OOO 승리!" 표시. 다시 하기(호스트) / 나가기 |

- **시작**: 호스트가 "시작" 클릭 → 서버가 정답 숫자 생성, 모든 참가자에게 범위 1~100 부여 → 게임 화면으로 전환.
- **제출**: 숫자 입력 후 제출 → 서버 응답(업/다운/정답) → 범위 갱신 또는 게임 종료.
- **종료**: 누군가 정답 제출 시 즉시 종료. Realtime으로 전원에게 승자 표시.

---

## 3. 데이터 모델 (Supabase)

업다운 전용 테이블 사용 (시간 맞추기와 분리).

### 3.1 `updown_rooms`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| code | text | 6자리 방 코드, unique |
| name | text | 방 제목 |
| host_client_id | text | 방장 client_id |
| created_at | timestamptz | |
| closed_at | timestamptz | nullable, 방 종료 시각 |

### 3.2 `updown_room_players`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| room_id | uuid | FK → updown_rooms |
| client_id | text | |
| nickname | text | |
| joined_at | timestamptz | |
| unique(room_id, client_id) | | |

### 3.3 `updown_rounds`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| room_id | uuid | FK → updown_rooms |
| secret_number | int | 1~100, 서버만 알고 있음 |
| status | text | 'playing' \| 'finished' |
| winner_client_id | text | nullable, 정답 맞춘 사람 |
| created_at | timestamptz | |

- Realtime 구독: `status`, `winner_client_id` 변경 시 전원에게 결과 화면 반영.

### 3.4 `updown_round_player_ranges`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| round_id | uuid | FK → updown_rounds |
| client_id | text | |
| min | int | 현재 범위 하한 (초기 1) |
| max | int | 현재 범위 상한 (초기 100) |
| primary key (round_id, client_id) | | |

- 각 제출 시 해당 행의 min/max만 갱신. 클라이언트는 제출 응답으로 새 min/max 받아도 되고, 필요 시 Realtime으로 구독해도 됨.

---

## 4. Edge Functions

### 4.1 `start-updown-round` (POST)

- **역할**: 호스트가 "시작" 시 라운드 생성 및 전원 범위 초기화.
- **입력**: `{ "room_id": "uuid", "client_id": "string" }`
- **로직**:
  1. `updown_rooms`에서 room 조회, `closed_at` null, `host_client_id === client_id` 확인.
  2. `secret_number = random(1, 100)` 생성.
  3. `updown_rounds`에 insert: room_id, secret_number, status='playing', winner_client_id=null.
  4. 해당 room의 `updown_room_players` 전원에 대해 `updown_round_player_ranges`에 insert: round_id, client_id, min=1, max=100.
- **응답**: `{ "round_id": "uuid" }` (secret_number는 절대 내려주지 않음).

### 4.2 `submit-updown-guess` (POST)

- **역할**: 숫자 제출 처리. 서버만 secret_number를 보므로 반드시 Edge Function에서 처리.
- **입력**: `{ "round_id": "uuid", "client_id": "string", "guess": number }`
- **로직**:
  1. `updown_rounds`에서 round 조회. status !== 'playing' 이면 400 (이미 종료).
  2. `updown_round_player_ranges`에서 (round_id, client_id) 행 조회. 없으면 400.
  3. `guess`가 `min <= guess <= max` 아니면 400 (범위 위반).
  4. `guess === secret_number`:
     - `updown_rounds` update: status='finished', winner_client_id=client_id.
     - 응답: `{ "result": "correct" }`. (새 min/max 불필요)
  5. `guess < secret_number`:
     - `updown_round_player_ranges` update: min = guess + 1.
     - 응답: `{ "result": "up", "min": guess+1, "max": max }`.
  6. `guess > secret_number`:
     - `updown_round_player_ranges` update: max = guess - 1.
     - 응답: `{ "result": "down", "min": min, "max": guess-1 }`.
- **응답**: JSON. 클라이언트는 result에 따라 UI 갱신(업/다운/정답) 및 범위 표시.

---

## 5. RLS 및 Realtime

- **RLS**: updown_rooms, updown_room_players는 해당 room 참가자만 읽기/쓰기 허용. updown_rounds는 room 참가자만 읽기, insert/update는 service role(Edge Function)만. updown_round_player_ranges는 해당 round의 room 참가자만 읽기, 수정은 Edge Function만.
- **Realtime**: `updown_rounds` (status, winner_client_id)를 구독해, `finished`가 되면 모든 클라이언트에서 "OOO 승리!" 표시 및 입력 비활성화.
- 필요 시 `updown_round_player_ranges`는 구독하지 않고, 제출 응답의 min/max만으로 로컬 상태 유지해도 됨.

---

## 6. 클라이언트 (프론트) 구조

- **경로**: `public/games/updown-game/` (시간 맞추기와 동일한 패턴).
- **파일 예시**:
  - `index.html` — 진입점, 스크립트 로드.
  - `style.css` — 공통/화면별 스타일.
  - `config.example.js` — SUPABASE_URL, SUPABASE_ANON_KEY (배포 시 config.js로 복사).
  - `state.js` — clientId, nickname, roomId, roomCode, roomName, isHost, currentRound(round_id, min, max), winnerNickname, winCounts(client_id → N승) 등. Supabase 클라이언트 생성 헬퍼.
  - `app.js` — 화면 전환, 방 생성/입장, 대기실 목록(**승수 표시**), 시작 버튼, 게임 화면(범위 표시, **참가자별 승수**, 입력, 제출), 결과 화면, Realtime 구독, 나가기.
- **진입**: 메인 앱의 `manifest.json`에 `{ "file": "updown-game/index.html", "title": "업다운", "slug": "updown-game" }` 추가.

---

## 7. 화면별 동작

- **닉네임**: 저장소에 client_id, nickname 유지 (로컬스토리지 등). 방 만들기 / 방 들어가기 버튼.
- **방 만들기**: 방 제목 입력 → API로 room 생성 + 본인 room_players 추가 → 코드 표시 → "대기실로" 클릭 시 대기실 화면.
- **방 들어가기**: 코드 입력 → room 조회 후 room_players 추가 → 대기실.
- **대기실**: room 이름, 참가자 리스트(닉네임 + **N승**). 승수는 `updown_rounds`에서 해당 room_id, status='finished'인 행들 중 `winner_client_id = client_id` 개수로 계산. Realtime으로 room_players 구독. 호스트만 "시작" 표시. "시작" 클릭 시 `start-updown-round` 호출 → 응답으로 round_id 수신 → 게임 화면으로 전환, 로컬 state에 round_id, min=1, max=100 설정.
- **게임 화면**:
  - 상단: "현재 범위: {min} ~ {max}".
  - 참가자 영역: 닉네임 + **(N승)** (시간 맞추기처럼). 승수는 같은 방식으로 room 내 과거 라운드 winner_client_id 집계.
  - 입력: number (1~100, 현재 min~max만 허용), 제출 버튼.
  - 제출 시 `submit-updown-guess` 호출. 응답이 `up`/`down`이면 범위 갱신 후 다시 입력 가능. `correct`면 "당신이 승리!" 표시, Realtime으로 round가 finished 되면 다른 사람 화면에는 "OOO 승리!" 표시.
  - Realtime: updown_rounds where id=current round_id 구독. status가 'finished'가 되면 winner_client_id로 닉네임 조회(room_players에서) 후 "OOO 승리!" 표시, 입력 비활성화.
- **결과**: "OOO 승리!" / "다시 하기"(호스트만) / "나가기". 다시 하기 시 대기실로 돌아가서 호스트가 다시 "시작" 누르면 새 round 생성. 승수는 새 라운드 시작 시점에 다시 조회해 반영.

---

## 8. 예외 처리

- **이미 종료된 라운드에 제출**: 400, 메시지 "게임이 이미 종료되었습니다."
- **범위 밖 숫자 제출**: 400, 메시지 "현재 범위 안의 숫자만 입력하세요." (클라이언트에서도 min~max 밖이면 제출 전에 막을 수 있음.)
- **방 없음/닫힌 방**: 입장 시 404/400. 시작 시 404.
- **호스트 아님**: start-updown-round 403.
- **네트워크 오류**: 재시도 또는 안내 메시지.

---

## 9. 구현 순서 제안

1. **Supabase**: updown 테이블 4개 생성, RLS, Realtime publication.
2. **Edge Functions**: `start-updown-round`, `submit-updown-guess` 배포 및 테스트.
3. **클라이언트**: index.html, style.css, config, state.js, app.js — 닉네임 → 방 만들기/입장 → 대기실(승수 표시) → 시작 → 게임(범위+참가자별 승수+제출) → 결과(승자 표시, 다시 하기/나가기).
4. **manifest**: 메인 앱에 업다운 게임 링크 추가.
5. **테스트**: 1인(혼자 시작해서 본인이 정답 맞추기), 2인(각자 기기에서 동시 제출, 한 명이 먼저 맞추면 다른 쪽에 "OOO 승리!" 표시).

---

## 10. 승수 표시 (확정)

- **데이터**: 별도 컬럼 없음. `updown_rounds`에서 `room_id = 현재 방` 이고 `status = 'finished'`인 행들에 대해 `winner_client_id`별로 count.
- **대기실**: 참가자 목록 각 항목에 "닉네임 (N승)" 형태로 표시.
- **게임 화면**: 참가자 영역(플레이어 슬롯)에 "닉네임 (N승)" 표시. 라운드 종료 후 다시 하기 시 승수 갱신.

---

## 11. (선택) 나중에 확장

- **범위 설정**: 1~100 고정 유지 시 생략. 필요 시 1~50, 1~200 등 옵션 추가 가능.
- **히스토리**: round_guesses 테이블로 제출 이력 저장 후 "지금까지 업/다운 로그" 표시 (선택).

이 계획대로 구현하면 "서버가 정한 숫자를 먼저 맞추는 실시간 레이스"가 동작한다.
