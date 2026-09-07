"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isFutureLocalDate, localDateTimeToIso } from "@/lib/time";

const team=z.object({client_key:z.string().min(1),label:z.string().trim().min(1).max(40),set_wins:z.number().int().min(0)});
const player=z.object({player_id:z.string().uuid().optional(),name:z.string().trim().min(1).max(80).optional(),team_key:z.string().optional(),goals:z.number().int().min(0),assists:z.number().int().min(0)}).refine(v=>v.player_id||v.name,"Player identity required");
const session=z.object({group_id:z.string().uuid(),client_session_id:z.string().uuid(),date:z.string().date(),time:z.string().regex(/^\d{2}:\d{2}$/),timezone:z.string().min(1),format:z.enum(["none","fixed_teams","sets"]),teams:z.array(team).max(8),players:z.array(player).min(1).max(100)}).superRefine((value,context)=>{
  if(value.format==="none"&&value.teams.length!==0)context.addIssue({code:"custom",path:["teams"],message:"No-team sessions cannot contain teams"});
  if(value.format==="fixed_teams"&&value.teams.length!==2)context.addIssue({code:"custom",path:["teams"],message:"Fixed-team sessions require exactly two teams"});
  if(value.format==="sets"&&value.teams.length<2)context.addIssue({code:"custom",path:["teams"],message:"Set play requires at least two teams"});
  const labels=value.teams.map(item=>item.label.trim().toLocaleLowerCase());
  if(new Set(labels).size!==labels.length)context.addIssue({code:"custom",path:["teams"],message:"Team names must be unique"});
  const keys=new Set(value.teams.map(item=>item.client_key));
  if(value.format!=="none"&&value.players.some(item=>!item.team_key||!keys.has(item.team_key)))context.addIssue({code:"custom",path:["players"],message:"Every player needs a valid team"});
});
export type SessionActionInput=z.input<typeof session>;
export async function saveSessionAction(input:SessionActionInput){
  try{
    const checked=session.safeParse(input);
    if(!checked.success)return {ok:false as const,error:"Check the roster, teams, and stats, then try again."};
    if(isFutureLocalDate(checked.data.date,checked.data.timezone))return {ok:false as const,error:"Session date can’t be in the future."};
    const supabase=await createClient();
    if(!supabase)return {ok:true as const,id:input.client_session_id,demo:true};
    const command={...checked.data,kickoff_at:localDateTimeToIso(checked.data.date,checked.data.time,checked.data.timezone)};
    const {data,error}=await supabase.rpc("save_session",{command});
    if(error){
      console.error("save_session RPC failed",{code:error.code,message:error.message,details:error.details,hint:error.hint});
      if(error.code==="42501")return {ok:false as const,error:"Your sign-in has expired. Refresh the page and sign in again."};
      return {ok:false as const,error:"Couldn’t save. Your session is still here — try again."};
    }
    return {ok:true as const,id:String(data),demo:false};
  }catch(error){
    console.error("saveSessionAction failed",error);
    return {ok:false as const,error:"The server couldn’t complete the save. Your session draft is still safe."};
  }
}

const schedule=z.object({day_of_week:z.number().int().min(1).max(7),kickoff_time:z.string().regex(/^\d{2}:\d{2}$/),venue:z.string().max(120).optional()});
const group=z.object({name:z.string().trim().min(1).max(80),timezone:z.string().min(1),default_session_format:z.enum(["none","fixed_teams","sets"]),visibility:z.enum(["private","public"]).default("private"),schedules:z.array(schedule).max(7)});
export async function createGroupAction(input:z.input<typeof group>){const checked=group.safeParse(input);if(!checked.success)return {ok:false as const,error:"Check the group details and try again."};const supabase=await createClient();if(!supabase)return {ok:false as const,error:"Connect Supabase to create a real group."};const {data,error}=await supabase.rpc("create_group",{command:checked.data});return error?{ok:false as const,error:"Couldn’t create the group. Try again."}:{ok:true as const,id:String(data)};}

export async function addPlayerAction(groupId:string,name:string){const checked=z.object({groupId:z.string().uuid(),name:z.string().trim().min(1).max(80)}).safeParse({groupId,name});if(!checked.success)return {ok:false as const,error:"Enter a valid player name."};const supabase=await createClient();if(!supabase)return {ok:true as const,id:crypto.randomUUID(),demo:true};const {data,error}=await supabase.from("players").insert({group_id:groupId,name:checked.data.name}).select("id").single();return error?{ok:false as const,error:"That player may already be on this roster."}:{ok:true as const,id:String(data.id),demo:false};}
export async function setPlayerActiveAction(groupId:string,playerId:string,active:boolean){if(!z.string().uuid().safeParse(groupId).success||!z.string().uuid().safeParse(playerId).success)return {ok:false as const,error:"Invalid player."};const supabase=await createClient();if(!supabase)return {ok:true as const,demo:true};const {error}=await supabase.from("players").update({active}).eq("group_id",groupId).eq("id",playerId);return error?{ok:false as const,error:"Couldn’t update the player."}:{ok:true as const,demo:false};}
export async function updateGroupSettingsAction(groupId:string,visibility:"public"|"private",format:"none"|"fixed_teams"|"sets",schedules:{day_of_week:number;kickoff_time:string;venue?:string;active:boolean}[]){const checked=z.object({groupId:z.string().uuid(),visibility:z.enum(["public","private"]),format:z.enum(["none","fixed_teams","sets"]),schedules:z.array(schedule.extend({active:z.boolean()})).max(7)}).safeParse({groupId,visibility,format,schedules});if(!checked.success)return {ok:false as const,error:"Check the settings."};const supabase=await createClient();if(!supabase)return {ok:true as const,demo:true};const {error}=await supabase.rpc("update_group_settings",{command:{group_id:groupId,visibility,default_session_format:format,schedules}});return error?{ok:false as const,error:"Couldn’t save settings. Nothing was changed."}:{ok:true as const,demo:false};}

export async function regenerateShareTokenAction(groupId:string){if(!z.string().uuid().safeParse(groupId).success)return {ok:false as const,error:"Invalid group."};const supabase=await createClient();if(!supabase)return {ok:true as const,token:crypto.randomUUID(),demo:true};const {data,error}=await supabase.rpc("regenerate_share_token",{target_group:groupId});return error?{ok:false as const,error:"Couldn’t regenerate the private link."}:{ok:true as const,token:String(data),demo:false};}
