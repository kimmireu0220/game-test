-- room_players를 Realtime publication에 추가 (참가자 입장/퇴장 시 대기실 목록 즉시 반영)
-- 이미 001_tables.sql 최신 버전으로 만든 DB는 불필요. 기존 DB만 이 파일 실행하세요.
alter publication supabase_realtime add table public.room_players;
