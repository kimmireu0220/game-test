-- RLS 정책: 업다운 게임 (anon 클라이언트 + Edge Function service_role)
-- 001_tables.sql 실행 후 실행하세요.

alter table public.updown_rooms enable row level security;
alter table public.updown_room_players enable row level security;
alter table public.updown_rounds enable row level security;
alter table public.updown_round_player_ranges enable row level security;

-- updown_rooms: anon으로 생성/읽기/수정/삭제
create policy "updown_rooms_all_anon" on public.updown_rooms for all to anon using (true) with check (true);

-- updown_room_players: anon으로 읽기/삽입/삭제
create policy "updown_room_players_all_anon" on public.updown_room_players for all to anon using (true) with check (true);

-- updown_rounds: anon은 읽기만. 삽입/수정은 Edge Function(service_role)에서만.
create policy "updown_rounds_select_anon" on public.updown_rounds for select to anon using (true);
create policy "updown_rounds_insert_service" on public.updown_rounds for insert to service_role with check (true);
create policy "updown_rounds_update_service" on public.updown_rounds for update to service_role using (true) with check (true);

-- updown_round_player_ranges: anon은 읽기만. 삽입/수정은 Edge Function에서만.
create policy "updown_round_player_ranges_select_anon" on public.updown_round_player_ranges for select to anon using (true);
create policy "updown_round_player_ranges_insert_service" on public.updown_round_player_ranges for insert to service_role with check (true);
create policy "updown_round_player_ranges_update_service" on public.updown_round_player_ranges for update to service_role using (true) with check (true);
