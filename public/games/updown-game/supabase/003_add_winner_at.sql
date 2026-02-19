-- 기존 DB에 winner_at 컬럼 추가 (이미 있으면 무시)
alter table public.updown_rounds add column if not exists winner_at timestamptz;
