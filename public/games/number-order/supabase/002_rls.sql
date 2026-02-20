-- RLS 정책: 숫자 레이스 (anon 클라이언트 + Edge Function service_role)
-- 001_tables.sql 실행 후 실행하세요.

alter table public.no_rooms enable row level security;
alter table public.no_room_players enable row level security;
alter table public.no_rounds enable row level security;
alter table public.no_round_results enable row level security;

-- no_rooms: anon으로 생성/읽기/수정
create policy "no_rooms_all_anon" on public.no_rooms for all to anon using (true) with check (true);

-- no_room_players: anon으로 읽기/삽입/삭제
create policy "no_room_players_all_anon" on public.no_room_players for all to anon using (true) with check (true);

-- no_rounds: anon은 읽기만. 삽입은 Edge Function(service_role)에서만.
create policy "no_rounds_select_anon" on public.no_rounds for select to anon using (true);
create policy "no_rounds_insert_service" on public.no_rounds for insert to service_role with check (true);

-- no_round_results: anon 삽입(자기 결과 제출)/읽기
create policy "no_round_results_all_anon" on public.no_round_results for all to anon using (true) with check (true);
