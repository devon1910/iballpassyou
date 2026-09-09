-- Balancing assessments remain nullable for historical players and admin-only under
-- players_admin_all. Public/shared payloads deliberately retain their explicit fields.
alter table public.players
  add column primary_position text check (primary_position in ('goalkeeper','defender','midfielder','attacker')),
  add column secondary_position text check (secondary_position in ('goalkeeper','defender','midfielder','attacker')),
  add column keeper_capable boolean not null default false,
  add column skill_level smallint check (skill_level between 1 and 5);

create or replace function public.read_admin_group(target_group uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb; token uuid;
begin
  if not public.is_group_admin(target_group) then
    raise exception using errcode='42501',message='not authorized';
  end if;
  select public.group_read_payload(target_group),share_token into payload,token
    from public.groups where id=target_group;
  return payload || jsonb_build_object('share_token',token,'players',coalesce((
    select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'active',p.active,
      'primary_position',p.primary_position,'secondary_position',p.secondary_position,
      'keeper_capable',p.keeper_capable,'skill_level',p.skill_level) order by p.name)
    from public.players p where p.group_id=target_group),'[]'::jsonb));
end $$;
revoke all on function public.read_admin_group(uuid) from public,anon;
grant execute on function public.read_admin_group(uuid) to authenticated;

-- Preserve the existing session writer and its result semantics. The wrapper saves
-- a newly entered player's profile in the same transaction as their first session.
alter function public.save_session(jsonb) rename to save_session_without_balancing;
revoke all on function public.save_session_without_balancing(jsonb) from public,anon,authenticated;
create function public.save_session(command jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare target_session uuid; target_group uuid := (command->>'group_id')::uuid;
  attendee jsonb; profile jsonb;
begin
  if not public.is_group_admin(target_group) then
    raise exception using errcode='42501',message='not authorized';
  end if;
  -- Preserve idempotent retries without overwriting a later admin assessment.
  select id into target_session from public.sessions
    where group_id=target_group and client_session_id=(command->>'client_session_id')::uuid;
  if target_session is not null and command->>'session_id' is null then return target_session; end if;
  target_session := public.save_session_without_balancing(command);
  for attendee in select value from jsonb_array_elements(command->'players') loop
    profile := attendee->'balancing';
    if attendee->>'player_id' is null and profile is not null then
      if profile->>'primaryPosition' is null or profile->>'skillLevel' is null then
        raise exception using errcode='22023',message='position and Skill Level required';
      end if;
      update public.players p set primary_position=profile->>'primaryPosition',
        secondary_position=profile->>'secondaryPosition',
        keeper_capable=coalesce((profile->>'keeperCapable')::boolean,false),
        skill_level=(profile->>'skillLevel')::smallint
      where p.group_id=target_group
        and lower(regexp_replace(btrim(p.name),'\s+',' ','g'))=lower(regexp_replace(btrim(attendee->>'name'),'\s+',' ','g'))
        and exists(select 1 from public.session_players sp where sp.session_id=target_session and sp.player_id=p.id and sp.group_id=target_group);
    end if;
  end loop;
  return target_session;
end $$;
revoke all on function public.save_session(jsonb) from public,anon;
grant execute on function public.save_session(jsonb) to authenticated;
