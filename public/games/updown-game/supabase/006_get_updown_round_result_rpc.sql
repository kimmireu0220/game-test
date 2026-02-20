-- 라운드 종료 시 created_at, start_at + 정답 목록을 한 번에 반환 (클라이언트 요청 1회로 해결)
create or replace function public.get_updown_round_result(p_round_id uuid)
returns table(created_at timestamptz, start_at timestamptz, correct_list jsonb)
language sql
security definer
set search_path = public
as $$
  select
    r.created_at,
    r.start_at,
    coalesce(
      (select jsonb_agg(
         jsonb_build_object('client_id', c.client_id, 'correct_at', c.correct_at)
         order by c.correct_at
       ) from updown_round_correct c where c.round_id = p_round_id),
      '[]'::jsonb
    )
  from updown_rounds r
  where r.id = p_round_id and r.status = 'finished'
  limit 1;
$$;

comment on function public.get_updown_round_result(uuid) is '업다운 라운드 결과: created_at, start_at + 정답 목록(correct_at 순) 한 번에 반환';

-- anon이 호출 가능 (같은 방/라운드 데이터만 노출되도록 RLS는 테이블 단위이므로, 함수는 finished 라운드만 반환)
grant execute on function public.get_updown_round_result(uuid) to anon;
