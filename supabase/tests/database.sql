-- Run after a local `supabase db reset`. Assertions abort the transaction on failure.
begin;
do $$ begin
  if not exists(select 1 from pg_class where relname='groups' and relrowsecurity) then raise exception 'groups RLS is not enabled'; end if;
  if has_table_privilege('anon','public.groups','select') then raise exception 'anon can read raw groups'; end if;
  if has_table_privilege('anon','public.group_members','select') then raise exception 'anon can read memberships'; end if;
  if not has_function_privilege('anon','public.explore_public_groups()','execute') then raise exception 'explore rpc unavailable'; end if;
end $$;
-- Composite FKs are the database-level tenant boundary; verify they exist.
do $$ declare count_fk integer; begin select count(*) into count_fk from pg_constraint where conrelid='public.session_players'::regclass and contype='f';if count_fk<>3 then raise exception 'expected 3 tenant-safe session player foreign keys, got %',count_fk;end if;end $$;
do $$ declare policy_count integer; begin select count(*) into policy_count from pg_policies where schemaname='public' and tablename in ('groups','group_schedules','group_members','players','sessions','session_teams','session_players');if policy_count<7 then raise exception 'expected deny-by-default admin policies';end if;end $$;
do $$ begin
  if not has_function_privilege('authenticated','public.create_group(jsonb)','execute') then raise exception 'authenticated create_group unavailable';end if;
  if not has_function_privilege('authenticated','public.save_session(jsonb)','execute') then raise exception 'authenticated save_session unavailable';end if;
  if has_function_privilege('anon','public.save_session(jsonb)','execute') then raise exception 'anon can save sessions';end if;
  if has_function_privilege('anon','public.read_admin_group(uuid)','execute') then raise exception 'anon can call admin read';end if;
end $$;
rollback;
