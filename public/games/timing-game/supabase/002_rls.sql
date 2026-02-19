-- RLS 정책: 시간 맞추기 게임 (timing_* 테이블, anon 클라이언트용 단순 정책)
-- 001_tables.sql 실행 후 실행하세요.

alter table public.timing_rooms enable row level security;
alter table public.timing_room_players enable row level security;
alter table public.timing_rounds enable row level security;
alter table public.timing_round_presses enable row level security;

-- timing_rooms: anon으로 생성/읽기/수정/삭제 (호스트 나가기 시 클라이언트에서 삭제 또는 closed_at 설정)
create policy "timing_rooms_all_anon" on public.timing_rooms for all to anon using (true) with check (true);

-- timing_room_players: anon으로 읽기/삽입/삭제
create policy "timing_room_players_all_anon" on public.timing_room_players for all to anon using (true) with check (true);

-- timing_rounds: anon은 읽기만. 삽입은 Edge Function(service_role)에서만.
create policy "timing_rounds_select_anon" on public.timing_rounds for select to anon using (true);
create policy "timing_rounds_insert_service" on public.timing_rounds for insert to service_role with check (true);

-- timing_round_presses: anon으로 읽기/삽입
create policy "timing_round_presses_all_anon" on public.timing_round_presses for all to anon using (true) with check (true);
