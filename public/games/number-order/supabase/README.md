# 숫자 레이스 (number-order) Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성 (또는 기존 프로젝트 사용).
2. SQL Editor에서 **순서대로** 실행:
   - `001_tables.sql` — no_rooms, no_room_players, no_rounds, no_round_results 테이블 및 Realtime 발행
   - `002_rls.sql` — RLS 활성화 및 정책
   - `003_no_round_winner.sql` — no_rounds에 winner_client_id 컬럼 및 정책
3. Edge Function 배포:
   - `start-number-order-round` — 호스트가 라운드 시작 시 호출 (no_rounds insert, start_at = now()+4초)
   - 서버 시각 동기화용으로 **common**의 `get-server-time` Edge Function을 같은 프로젝트에 한 번 배포해 두면 number-order에서 재사용합니다.
4. 프로젝트 설정 > API에서 Project URL, anon public key 복사 후 게임 `config.example.js`를 `config.js`로 복사해 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 설정.
