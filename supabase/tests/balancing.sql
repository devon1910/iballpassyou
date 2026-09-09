-- Run against a disposable local Supabase database after migrations.
begin;
do $$ begin
  if has_table_privilege('anon','public.players','select') then raise exception 'anonymous player access'; end if;
  if has_function_privilege('authenticated','public.save_session_without_balancing(jsonb)','execute') then raise exception 'internal writer exposed'; end if;
  if has_function_privilege('anon','public.read_admin_group(uuid)','execute') then raise exception 'admin metadata exposed'; end if;
end $$;
insert into auth.users(id) values ('99999999-0000-4000-8000-000000000001'),('99999999-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','99999999-0000-4000-8000-000000000001',true);
do $$ declare g uuid; p uuid; payload jsonb; s uuid; command jsonb; begin
  g := public.create_group('{"name":"Balancing test","timezone":"Africa/Lagos","default_session_format":"fixed_teams","visibility":"public","schedules":[]}'::jsonb);
  insert into public.players(group_id,name,primary_position,skill_level) values(g,'Test player','defender',4) returning id into p;
  payload := public.read_admin_group(g);
  if payload->'players'->0->>'skill_level' <> '4' then raise exception 'admin skill missing'; end if;
  if public.read_public_group(payload->>'public_slug')->'players'->0 ? 'skill_level' then raise exception 'public skill leak'; end if;
  if public.read_shared_group((payload->>'share_token')::uuid)->'players'->0 ? 'skill_level' then raise exception 'shared skill leak'; end if;
  begin
    update public.players set skill_level=6 where id=p;
    raise exception 'invalid skill accepted';
  exception when check_violation then null; end;
  begin
    update public.players set primary_position='striker' where id=p;
    raise exception 'invalid position accepted';
  exception when check_violation then null; end;
  command := jsonb_build_object('group_id',g,'client_session_id',gen_random_uuid(),'kickoff_at','2026-09-01T17:00:00Z','format','fixed_teams',
    'teams',jsonb_build_array(jsonb_build_object('client_key','0','label','Red','set_wins',1),jsonb_build_object('client_key','1','label','Black','set_wins',0)),
    'players',jsonb_build_array(jsonb_build_object('player_id',p,'team_key','0','goals',2,'assists',1),jsonb_build_object('name','New player','team_key','1','goals',0,'assists',0,
      'balancing',jsonb_build_object('primaryPosition','midfielder','secondaryPosition',null,'keeperCapable',true,'skillLevel',3))));
  s := public.save_session(command);
  if (select count(*) from public.session_players where session_id=s) <> 2 then raise exception 'assignments missing'; end if;
  if not exists(select 1 from public.players where group_id=g and name='New player' and skill_level=3 and keeper_capable) then raise exception 'new profile not saved'; end if;
  if public.save_session(command) <> s then raise exception 'retry not idempotent'; end if;
  perform set_config('request.jwt.claim.sub','99999999-0000-4000-8000-000000000002',true);
  if exists(select 1 from public.players where group_id=g) then raise exception 'cross-tenant read'; end if;
  update public.players set skill_level=1 where id=p;
  if found then raise exception 'cross-tenant write'; end if;
  begin
    perform public.read_admin_group(g);
    raise exception 'unauthorized admin read';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
