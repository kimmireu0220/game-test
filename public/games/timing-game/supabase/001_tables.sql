-- 시간 맞추기 게임: Supabase 테이블 (timing_ 접두어) 및 Realtime
-- Supabase 대시보드 SQL Editor에서 실행하세요.

-- timing_rooms: 방 (호스트 나가면 삭제 또는 closed_at 설정)
create table if not exists public.timing_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  name text not null,
  host_client_id text not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_timing_rooms_code on public.timing_rooms(code);
create index if not exists idx_timing_rooms_closed_at on public.timing_rooms(closed_at) where closed_at is null;

-- timing_room_players: 방 참가자
create table if not exists public.timing_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.timing_rooms(id) on delete cascade,
  client_id text not null,
  nickname text not null,
  joined_at timestamptz not null default now(),
  unique(room_id, client_id)
);

create index if not exists idx_timing_room_players_room_id on public.timing_room_players(room_id);

-- timing_rounds: 라운드 (start_at = 서버 시각, Edge Function에서 now()+4초 등으로 설정)
create table if not exists public.timing_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.timing_rooms(id) on delete cascade,
  start_at timestamptz not null,
  target_seconds int not null check (target_seconds >= 5 and target_seconds <= 10),
  created_at timestamptz not null default now()
);

create index if not exists idx_timing_rounds_room_id on public.timing_rounds(room_id);

-- timing_round_presses: 누른 시각 (created_at = 서버 시각으로 오차 계산)
create table if not exists public.timing_round_presses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.timing_rounds(id) on delete cascade,
  client_id text not null,
  created_at timestamptz not null default now(),
  unique(round_id, client_id)
);

create index if not exists idx_timing_round_presses_round_id on public.timing_round_presses(round_id);

-- Realtime 활성화 (참가자 입장/퇴장, 라운드 시작 시 즉시 반영)
alter publication supabase_realtime add table public.timing_rooms;
alter publication supabase_realtime add table public.timing_room_players;
alter publication supabase_realtime add table public.timing_rounds;
