-- 임시: 업다운 범위 1~50 → 1~1 로 변경 (이미 001_tables.sql 적용된 DB용)
-- Supabase SQL Editor에서 실행하세요.

-- updown_rounds: secret_number 1~1
do $$
begin
  alter table public.updown_rounds drop constraint if exists updown_rounds_secret_number_check;
  alter table public.updown_rounds add constraint updown_rounds_secret_number_check
    check (secret_number >= 1 and secret_number <= 1);
exception when others then
  raise notice 'updown_rounds constraint: %', sqlerrm;
end $$;

-- updown_round_player_ranges: min, max 1~1
do $$
begin
  alter table public.updown_round_player_ranges drop constraint if exists updown_round_player_ranges_min_check;
  alter table public.updown_round_player_ranges add constraint updown_round_player_ranges_min_check
    check (min >= 1 and min <= 1);
exception when others then
  raise notice 'min constraint: %', sqlerrm;
end $$;

do $$
begin
  alter table public.updown_round_player_ranges drop constraint if exists updown_round_player_ranges_max_check;
  alter table public.updown_round_player_ranges add constraint updown_round_player_ranges_max_check
    check (max >= 1 and max <= 1);
exception when others then
  raise notice 'max constraint: %', sqlerrm;
end $$;
