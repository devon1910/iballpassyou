-- New groups are publicly discoverable unless an admin explicitly chooses private.
alter table public.groups alter column visibility set default 'public';

create or replace function public.create_group(command jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); new_group uuid;
  requested_visibility text:=coalesce(command->>'visibility','public');
  base_slug text; candidate text; suffix integer:=1; schedule jsonb;
begin
  if actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if requested_visibility not in ('private','public') then raise exception using errcode='22023',message='invalid visibility'; end if;
  base_slug:=nullif(public.slugify(command->>'name'),''); candidate:=base_slug;
  if requested_visibility='public' then
    while exists(select 1 from public.groups where public_slug=candidate) loop
      suffix:=suffix+1; candidate:=base_slug||'-'||suffix;
    end loop;
  else candidate:=null;
  end if;
  insert into public.groups(name,timezone,default_session_format,visibility,public_slug)
  values(btrim(command->>'name'),command->>'timezone',command->>'default_session_format',requested_visibility,candidate)
  returning id into new_group;
  insert into public.group_members(group_id,user_id,role) values(new_group,actor,'owner');
  for schedule in select value from jsonb_array_elements(coalesce(command->'schedules','[]'::jsonb)) loop
    insert into public.group_schedules(group_id,day_of_week,kickoff_time,venue)
    values(new_group,(schedule->>'day_of_week')::smallint,(schedule->>'kickoff_time')::time,nullif(btrim(schedule->>'venue'),''));
  end loop;
  return new_group;
end $$;
revoke all on function public.create_group(jsonb) from public,anon;
grant execute on function public.create_group(jsonb) to authenticated;
