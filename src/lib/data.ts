import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { demoGroups, findGroup, findPublicGroup } from "@/lib/demo-data";
import type { Group } from "@/types/domain";

type Payload = Record<string, unknown>;
function mapGroup(raw: Payload): Group {
  const schedules=(raw.schedules as Payload[]??[]).map(s=>({id:String(s.id),dayOfWeek:Number(s.day_of_week),kickoffTime:String(s.kickoff_time).slice(0,5),venue:s.venue?String(s.venue):undefined,active:true}));
  const players=(raw.players as Payload[]??[]).map(p=>({id:String(p.id),name:String(p.name),active:p.active !== false,...("skill_level" in p ? {balancing:{primaryPosition:p.primary_position as import("@/lib/balance/types").Position|null,secondaryPosition:p.secondary_position as import("@/lib/balance/types").Position|null,keeperCapable:p.keeper_capable===true,skillLevel:p.skill_level===null?null:Number(p.skill_level)}} : {})}));
  const sessions=(raw.sessions as Payload[]??[]).map(s=>({id:String(s.id),clientSessionId:String(s.client_session_id??s.id),kickoffAt:String(s.kickoff_at),format:s.format as Group["defaultSessionFormat"],teams:(s.teams as Payload[]??[]).map(t=>({id:String(t.id),label:String(t.label),setWins:Number(t.set_wins)})),appearances:(s.players as Payload[]??[]).map(p=>({playerId:String(p.player_id),playerName:String(p.name),teamId:p.team_id?String(p.team_id):undefined,goals:Number(p.goals),assists:Number(p.assists)}))}));
  return {id:String(raw.id),name:String(raw.name),timezone:String(raw.timezone),defaultSessionFormat:raw.default_session_format as Group["defaultSessionFormat"],visibility:raw.visibility as Group["visibility"],publicSlug:raw.public_slug?String(raw.public_slug):undefined,shareToken:raw.share_token?String(raw.share_token):"",schedules,players,sessions};
}
export async function getGroupOr404(id:string){const client=await createClient();if(!client)return findGroup(id)??notFound();const {data,error}=await client.rpc("read_admin_group",{target_group:id});if(error||!data)return notFound();return mapGroup(data as Payload);}
export async function getPublicGroupOr404(slug:string){const client=await createClient();if(!client)return findPublicGroup(slug)??notFound();const {data,error}=await client.rpc("read_public_group",{slug});if(error||!data)return notFound();return mapGroup(data as Payload);}
export async function getSharedGroupOr404(token:string){const client=await createClient();if(!client)return demoGroups.find(g=>g.shareToken===token)??notFound();const {data,error}=await client.rpc("read_shared_group",{token});if(error||!data)return notFound();return mapGroup(data as Payload);}
export async function getMyGroups(){const client=await createClient();if(!client)return demoGroups;const {data,error}=await client.rpc("list_my_groups");return !error&&Array.isArray(data)?data.map(v=>mapGroup(v as Payload)):[];}
export async function getPublicGroups(){const client=await createClient();if(!client)return demoGroups.filter(g=>g.visibility==="public"&&g.sessions.length>0);const {data}=await client.rpc("explore_public_groups");if(!Array.isArray(data))return [];const groups=await Promise.all(data.map(async(item:Payload)=>{const {data:full}=await client.rpc("read_public_group",{slug:item.public_slug});return full?mapGroup(full as Payload):null;}));return groups.filter((g):g is Group=>Boolean(g&&g.sessions.length>0));}
