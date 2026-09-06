-- iballpassyou: tenant-safe raw football facts, transactional commands, and narrow public reads.
create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  timezone text not null,
  default_session_format text not null check (default_session_format in ('none','fixed_teams','sets')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  public_slug citext unique,
  share_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint public_group_has_slug check (visibility = 'private' or public_slug is not null),
  unique (id, visibility)
);
create table public.group_schedules (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7), kickoff_time time not null, venue text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (group_id,id), unique (group_id,day_of_week,kickoff_time)
);
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin')), created_at timestamptz not null default now(), primary key(group_id,user_id)
);
create table public.players (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(group_id,id)
);
create unique index players_group_normalized_name_uidx on public.players(group_id, lower(regexp_replace(btrim(name),'\s+',' ','g')));
create table public.sessions (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  kickoff_at timestamptz not null, format text not null check(format in ('none','fixed_teams','sets')), client_session_id uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(group_id,id), unique(group_id,client_session_id)
);
create table public.session_teams (
  id uuid primary key default gen_random_uuid(), group_id uuid not null, session_id uuid not null, label text not null check(length(btrim(label)) between 1 and 40),
  set_wins integer not null default 0 check(set_wins>=0), created_at timestamptz not null default now(),
  unique(group_id,session_id,id), unique(session_id,label),
  foreign key(group_id,session_id) references public.sessions(group_id,id) on delete cascade
);
create table public.session_players (
  group_id uuid not null, session_id uuid not null, player_id uuid not null, session_team_id uuid,
  goals integer not null default 0 check(goals>=0), assists integer not null default 0 check(assists>=0), primary key(session_id,player_id),
  foreign key(group_id,session_id) references public.sessions(group_id,id) on delete cascade,
  foreign key(group_id,player_id) references public.players(group_id,id),
  foreign key(group_id,session_id,session_team_id) references public.session_teams(group_id,session_id,id)
);

create index group_members_user_idx on public.group_members(user_id,group_id);
create index group_schedules_group_idx on public.group_schedules(group_id,active,day_of_week);
create index players_group_idx on public.players(group_id,active);
create index sessions_group_kickoff_idx on public.sessions(group_id,kickoff_at desc);
create index session_players_group_idx on public.session_players(group_id,session_id);
create index session_players_player_idx on public.session_players(group_id,player_id);
create index session_teams_session_idx on public.session_teams(group_id,session_id);
create index groups_explore_idx on public.groups(visibility,public_slug) where visibility='public';

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger groups_touch before update on public.groups for each row execute function public.touch_updated_at();
create trigger schedules_touch before update on public.group_schedules for each row execute function public.touch_updated_at();
create trigger players_touch before update on public.players for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions for each row execute function public.touch_updated_at();

create or replace function public.is_group_admin(target_group uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.group_members gm where gm.group_id=target_group and gm.user_id=auth.uid() and gm.role in ('owner','admin'))
$$;
revoke all on function public.is_group_admin(uuid) from public,anon;
grant execute on function public.is_group_admin(uuid) to authenticated;

alter table public.groups enable row level security; alter table public.group_schedules enable row level security;
alter table public.group_members enable row level security; alter table public.players enable row level security;
alter table public.sessions enable row level security; alter table public.session_teams enable row level security; alter table public.session_players enable row level security;

create policy groups_admin_select on public.groups for select to authenticated using(public.is_group_admin(id));
create policy groups_admin_update on public.groups for update to authenticated using(public.is_group_admin(id)) with check(public.is_group_admin(id));
create policy schedules_admin_all on public.group_schedules for all to authenticated using(public.is_group_admin(group_id)) with check(public.is_group_admin(group_id));
create policy memberships_admin_select on public.group_members for select to authenticated using(public.is_group_admin(group_id));
create policy players_admin_all on public.players for all to authenticated using(public.is_group_admin(group_id)) with check(public.is_group_admin(group_id));
create policy sessions_admin_all on public.sessions for all to authenticated using(public.is_group_admin(group_id)) with check(public.is_group_admin(group_id));
create policy teams_admin_all on public.session_teams for all to authenticated using(public.is_group_admin(group_id)) with check(public.is_group_admin(group_id));
create policy session_players_admin_all on public.session_players for all to authenticated using(public.is_group_admin(group_id)) with check(public.is_group_admin(group_id));

revoke all on all tables in schema public from anon,authenticated;
grant select,update on public.groups to authenticated;
grant select,insert,update,delete on public.group_schedules,public.players,public.sessions,public.session_teams,public.session_players to authenticated;
grant select on public.group_members to authenticated;

create or replace function public.slugify(value text) returns text language sql immutable strict set search_path='' as $$
  select trim(both '-' from regexp_replace(lower(value),'[^a-z0-9]+','-','g'))
$$;

create or replace function public.create_group(command jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); new_group uuid; requested_visibility text:=coalesce(command->>'visibility','private'); base_slug text; candidate text; suffix integer:=1; schedule jsonb;
begin
  if actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if requested_visibility not in ('private','public') then raise exception using errcode='22023',message='invalid visibility'; end if;
  base_slug:=nullif(public.slugify(command->>'name'),''); candidate:=base_slug;
  if requested_visibility='public' then while exists(select 1 from public.groups where public_slug=candidate) loop suffix:=suffix+1;candidate:=base_slug||'-'||suffix;end loop; else candidate:=null;end if;
  insert into public.groups(name,timezone,default_session_format,visibility,public_slug)
  values(btrim(command->>'name'),command->>'timezone',command->>'default_session_format',requested_visibility,candidate) returning id into new_group;
  insert into public.group_members(group_id,user_id,role) values(new_group,actor,'owner');
  for schedule in select value from jsonb_array_elements(coalesce(command->'schedules','[]'::jsonb)) loop
    insert into public.group_schedules(group_id,day_of_week,kickoff_time,venue)
    values(new_group,(schedule->>'day_of_week')::smallint,(schedule->>'kickoff_time')::time,nullif(btrim(schedule->>'venue'),''));
  end loop;
  return new_group;
end $$;
revoke all on function public.create_group(jsonb) from public,anon; grant execute on function public.create_group(jsonb) to authenticated;

create or replace function public.save_session(command jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); target_group uuid:=(command->>'group_id')::uuid; session_key uuid:=(command->>'client_session_id')::uuid; target_session uuid; team jsonb; attendee jsonb; team_id uuid; actual_player uuid; player_count integer;
begin
  if actor is null or not public.is_group_admin(target_group) then raise exception using errcode='42501',message='not authorized'; end if;
  select id into target_session from public.sessions where group_id=target_group and client_session_id=session_key;
  if target_session is not null and command->>'session_id' is null then return target_session; end if;
  if command->>'session_id' is not null then
    target_session:=(command->>'session_id')::uuid;
    if not exists(select 1 from public.sessions where id=target_session and group_id=target_group) then raise exception using errcode='P0002',message='session not found';end if;
    update public.sessions set kickoff_at=(command->>'kickoff_at')::timestamptz,format=command->>'format',client_session_id=session_key where id=target_session and group_id=target_group;
    delete from public.session_teams where session_id=target_session and group_id=target_group;
  else
    insert into public.sessions(group_id,kickoff_at,format,client_session_id) values(target_group,(command->>'kickoff_at')::timestamptz,command->>'format',session_key) returning id into target_session;
  end if;
  create temporary table if not exists pg_temp.team_map(client_key text primary key,id uuid) on commit drop; truncate pg_temp.team_map;
  for team in select value from jsonb_array_elements(coalesce(command->'teams','[]'::jsonb)) loop
    insert into public.session_teams(group_id,session_id,label,set_wins) values(target_group,target_session,btrim(team->>'label'),coalesce((team->>'set_wins')::integer,0)) returning id into team_id;
    insert into pg_temp.team_map values(team->>'client_key',team_id);
  end loop;
  for attendee in select value from jsonb_array_elements(coalesce(command->'players','[]'::jsonb)) loop
    if attendee->>'player_id' is null then
      insert into public.players(group_id,name) values(target_group,btrim(attendee->>'name')) on conflict do nothing;
      select id into actual_player from public.players where group_id=target_group and lower(regexp_replace(btrim(name),'\s+',' ','g'))=lower(regexp_replace(btrim(attendee->>'name'),'\s+',' ','g'));
    else actual_player:=(attendee->>'player_id')::uuid;end if;
    select count(*) into player_count from public.players where id=actual_player and group_id=target_group and active;
    if player_count<>1 then raise exception using errcode='23503',message='invalid group player';end if;
    select id into team_id from pg_temp.team_map where client_key=attendee->>'team_key';
    if command->>'format'<>'none' and team_id is null then raise exception using errcode='23503',message='team assignment required';end if;
    insert into public.session_players(group_id,session_id,player_id,session_team_id,goals,assists)
    values(target_group,target_session,actual_player,team_id,coalesce((attendee->>'goals')::integer,0),coalesce((attendee->>'assists')::integer,0));
  end loop;
  if not exists(select 1 from public.session_players where session_id=target_session) then raise exception using errcode='22023',message='at least one player required';end if;
  return target_session;
end $$;
revoke all on function public.save_session(jsonb) from public,anon; grant execute on function public.save_session(jsonb) to authenticated;

create or replace function public.set_group_visibility(target_group uuid,new_visibility text) returns text language plpgsql security definer set search_path='' as $$
declare next_slug text;begin if not public.is_group_admin(target_group) then raise exception using errcode='42501',message='not authorized';end if;
if new_visibility='public' then select coalesce(public_slug,public.slugify(name)||'-'||substr(id::text,1,6)) into next_slug from public.groups where id=target_group;update public.groups set visibility='public',public_slug=next_slug where id=target_group;
elsif new_visibility='private' then update public.groups set visibility='private' where id=target_group;next_slug:=null;else raise exception using errcode='22023',message='invalid visibility';end if;return next_slug;end $$;
revoke all on function public.set_group_visibility(uuid,text) from public,anon;grant execute on function public.set_group_visibility(uuid,text) to authenticated;

create or replace function public.regenerate_share_token(target_group uuid) returns uuid language plpgsql security definer set search_path='' as $$declare token uuid;begin if not public.is_group_admin(target_group) then raise exception using errcode='42501',message='not authorized';end if;update public.groups set share_token=gen_random_uuid() where id=target_group returning share_token into token;return token;end$$;
revoke all on function public.regenerate_share_token(uuid) from public,anon;grant execute on function public.regenerate_share_token(uuid) to authenticated;

-- The anonymous API returns only group metadata and raw football facts needed by server-side aggregators.
create or replace function public.group_read_payload(target_group uuid) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('id',g.id,'name',g.name,'timezone',g.timezone,'default_session_format',g.default_session_format,'visibility',g.visibility,'public_slug',g.public_slug,
'schedules',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'day_of_week',s.day_of_week,'kickoff_time',s.kickoff_time,'venue',s.venue) order by s.day_of_week,s.kickoff_time) from public.group_schedules s where s.group_id=g.id and s.active),'[]'::jsonb),
'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name) from public.players p where p.group_id=g.id),'[]'::jsonb),
'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'kickoff_at',x.kickoff_at,'format',x.format,'teams',(select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'label',t.label,'set_wins',t.set_wins)),'[]'::jsonb) from public.session_teams t where t.session_id=x.id),'players',(select coalesce(jsonb_agg(jsonb_build_object('player_id',sp.player_id,'name',p.name,'team_id',sp.session_team_id,'goals',sp.goals,'assists',sp.assists)),'[]'::jsonb) from public.session_players sp join public.players p on p.id=sp.player_id and p.group_id=sp.group_id where sp.session_id=x.id)) order by x.kickoff_at desc) from public.sessions x where x.group_id=g.id),'[]'::jsonb)) from public.groups g where g.id=target_group
$$;
revoke all on function public.group_read_payload(uuid) from public,anon,authenticated;

create or replace function public.explore_public_groups() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'public_slug',g.public_slug,'timezone',g.timezone) order by g.name),'[]'::jsonb) from public.groups g where g.visibility='public'
$$;
create or replace function public.read_public_group(slug text) returns jsonb language sql stable security definer set search_path='' as $$select public.group_read_payload(g.id) from public.groups g where g.visibility='public' and g.public_slug=slug$$;
create or replace function public.read_shared_group(token uuid) returns jsonb language sql stable security definer set search_path='' as $$select public.group_read_payload(g.id) from public.groups g where g.share_token=token$$;
grant execute on function public.explore_public_groups(),public.read_public_group(text),public.read_shared_group(uuid) to anon,authenticated;

create or replace function public.read_admin_group(target_group uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb;token uuid;begin if not public.is_group_admin(target_group) then raise exception using errcode='42501',message='not authorized';end if;select public.group_read_payload(target_group),share_token into payload,token from public.groups where id=target_group;return payload||jsonb_build_object('share_token',token);end $$;
create or replace function public.list_my_groups() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(public.group_read_payload(gm.group_id)||jsonb_build_object('share_token',g.share_token) order by g.name),'[]'::jsonb) from public.group_members gm join public.groups g on g.id=gm.group_id where gm.user_id=auth.uid()
$$;
revoke all on function public.read_admin_group(uuid),public.list_my_groups() from public,anon;
grant execute on function public.read_admin_group(uuid),public.list_my_groups() to authenticated;

create or replace function public.update_group_settings(command jsonb) returns void language plpgsql security definer set search_path='' as $$
declare target uuid:=(command->>'group_id')::uuid; next_visibility text:=command->>'visibility'; item jsonb; next_slug text;
begin
  if not public.is_group_admin(target) then raise exception using errcode='42501',message='not authorized';end if;
  if next_visibility not in ('public','private') or command->>'default_session_format' not in ('none','fixed_teams','sets') then raise exception using errcode='22023',message='invalid settings';end if;
  select coalesce(public_slug,public.slugify(name)||'-'||substr(id::text,1,6)) into next_slug from public.groups where id=target;
  update public.groups set visibility=next_visibility,public_slug=case when next_visibility='public' then next_slug else public_slug end,default_session_format=command->>'default_session_format' where id=target;
  delete from public.group_schedules where group_id=target;
  for item in select value from jsonb_array_elements(coalesce(command->'schedules','[]'::jsonb)) loop insert into public.group_schedules(group_id,day_of_week,kickoff_time,venue,active) values(target,(item->>'day_of_week')::smallint,(item->>'kickoff_time')::time,nullif(btrim(item->>'venue'),''),coalesce((item->>'active')::boolean,true));end loop;
end $$;
revoke all on function public.update_group_settings(jsonb) from public,anon;grant execute on function public.update_group_settings(jsonb) to authenticated;
