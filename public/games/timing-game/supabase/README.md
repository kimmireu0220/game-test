# 시간 맞추기 게임 - Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성.
2. SQL Editor에서 순서대로 실행:
   - `001_tables.sql` — 테이블 생성 및 Realtime 발행
   - `002_rls.sql` — RLS 활성화 및 정책
   - `003_timing_round_winner.sql` — timing_rounds에 winner_client_id 컬럼 및 정책
3. Edge Function 배포:
   - `start-round`: 라운드 시작 시 서버 시각 기준 start_at 삽입.
   - `get-server-time`: **common**에 있음. 클라이언트 카운트다운/시작 시각 동기화용. 한 번만 배포하면 됨.
4. 프로젝트 설정 > API에서 Project URL, anon public key 복사 후 게임 `config.example.js`에 설정.

