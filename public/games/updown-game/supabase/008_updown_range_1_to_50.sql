-- 업다운 범위 1~1 → 1~50 복원 (이미 005 등으로 1~1 적용된 DB용)
-- Supabase SQL Editor에서 실행하세요.

-- updown_rounds: secret_number 1~50
do $$
begin
  alter table public.updown_rounds drop constraint if exists updown_rounds_secret_number_check;
  alter table public.updown_rounds add constraint updown_rounds_secret_number_check
    check (secret_number >= 1 and secret_number <= 50);
exception when others then
  raise notice 'updown_rounds constraint: %', sqlerrm;
end $$;

-- updown_round_player_ranges: min, max 1~50
do $$
begin
  alter table public.updown_round_player_ranges drop constraint if exists updown_round_player_ranges_min_check;
  alter table public.updown_round_player_ranges add constraint updown_round_player_ranges_min_check
    check (min >= 1 and min <= 50);
exception when others then
  raise notice 'min constraint: %', sqlerrm;
end $$;

do $$
begin
  alter table public.updown_round_player_ranges drop constraint if exists updown_round_player_ranges_max_check;
  alter table public.updown_round_player_ranges add constraint updown_round_player_ranges_max_check
    check (max >= 1 and max <= 50);
exception when others then
  raise notice 'max constraint: %', sqlerrm;
end $$;
