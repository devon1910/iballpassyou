-- Return public groups and their display data in one anonymous read.
create or replace function public.explore_public_group_payloads() returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(public.group_read_payload(g.id) order by g.name),'[]'::jsonb)
  from public.groups g
  where g.visibility='public'
$$;

revoke all on function public.explore_public_group_payloads() from public,anon,authenticated;
grant execute on function public.explore_public_group_payloads() to anon,authenticated;