-- 숫자 레이스(number-order): Supabase 테이블
-- Supabase 대시보드 SQL Editor에서 실행하세요.

-- no_rooms: 방 (호스트 나가면 closed_at 설정 가능)
create table if not exists public.no_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  name text not null,
  host_client_id text not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_no_rooms_code on public.no_rooms(code);
create index if not exists idx_no_rooms_closed_at on public.no_rooms(closed_at) where closed_at is null;

-- no_room_players: 방 참가자
create table if not exists public.no_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.no_rooms(id) on delete cascade,
  client_id text not null,
  nickname text not null,
  joined_at timestamptz not null default now(),
  unique(room_id, client_id)
);

create index if not exists idx_no_room_players_room_id on public.no_room_players(room_id);

-- no_rounds: 라운드 (start_at = Go! 시점, 서버 now()+4초)
create table if not exists public.no_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.no_rooms(id) on delete cascade,
  start_at timestamptz not null
);

create index if not exists idx_no_rounds_room_id on public.no_rounds(room_id);

-- no_round_results: 라운드별 플레이어 완료 기록 (16 터치 시 한 번만 insert)
create table if not exists public.no_round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.no_rounds(id) on delete cascade,
  client_id text not null,
  duration_ms int not null,
  unique(round_id, client_id)
);

create index if not exists idx_no_round_results_round_id on public.no_round_results(round_id);

-- Realtime
alter publication supabase_realtime add table public.no_rooms;
alter publication supabase_realtime add table public.no_room_players;
alter publication supabase_realtime add table public.no_rounds;
