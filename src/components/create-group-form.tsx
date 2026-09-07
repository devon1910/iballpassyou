"use client";
import { FormEvent,useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { ActionOverlay } from "@/components/action-overlay";
import { InfoTip } from "@/components/info-tip";
import { createGroupAction } from "@/app/app/actions";
import { WEEKDAYS } from "@/lib/format";
import type { SessionFormat,Visibility } from "@/types/domain";

export function CreateGroupForm(){
  const router=useRouter();
  const [days,setDays]=useState<number[]>([2]);
  const [variable,setVariable]=useState(false);
  const [visibility,setVisibility]=useState<Visibility>("private");
  const [format,setFormat]=useState<SessionFormat>("fixed_teams");
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  useEffect(() => { if (!pending) return; const timer = window.setTimeout(() => setPending(false), 10000); return () => window.clearTimeout(timer); }, [pending]);
  useEffect(() => { const clear = () => setPending(false); window.addEventListener("pageshow", clear); return () => window.removeEventListener("pageshow", clear); }, []);
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setPending(true);setError("");const values=new FormData(e.currentTarget);try{const result=await createGroupAction({name:String(values.get("name")??""),timezone:String(values.get("timezone")??"Africa/Lagos"),default_session_format:format,visibility,schedules:days.map(day=>({day_of_week:day,kickoff_time:String(values.get(`time-${day}`)??"18:00"),venue:String(values.get(`venue-${day}`)??"")}))});if(!result.ok){setPending(false);setError(result.error);return}router.push(`/app/groups/${result.id}`)}catch(error){console.error("Create group failed",error);setPending(false);setError("Couldn’t create the group. Try again.")}};
  return <><ActionOverlay active={pending} label="Creating group"/><form className="form-stack" onSubmit={submit} aria-busy={pending}>
    {error&&<p className="notice error" role="alert">{error}</p>}
    <label className="field"><span className="field-label">Group name</span><input className="input" name="name" required disabled={pending} placeholder="Friday Ballers"/></label>
    <label className="field"><span className="field-label">Timezone</span><select className="select" name="timezone" disabled={pending} defaultValue="Africa/Lagos"><option>Africa/Lagos</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Dubai</option></select></label>
    <fieldset disabled={pending}><legend className="field-label"><span className="with-tip">Usual football format <InfoTip label="Explain football formats"><strong>No teams</strong> tracks player stats only. <strong>Fixed teams</strong> has exactly two teams and one result. <strong>Set play</strong> supports 2–8 teams and any number of mini-matches.</InfoTip></span></legend>{[["none","No teams"],["fixed_teams","Fixed teams · one result"],["sets","Set play · multiple teams"]].map(([value,label])=><label className="radio-row" key={value}><input type="radio" checked={format===value} onChange={()=>setFormat(value as SessionFormat)}/><span>{label}</span></label>)}</fieldset>
    <fieldset disabled={pending}><legend className="field-label">When do you usually play?</legend><label className="check-row"><input type="checkbox" checked={variable} onChange={e=>{setVariable(e.target.checked);if(e.target.checked)setDays([])}}/><span>Our schedule varies</span></label>{!variable&&WEEKDAYS.map((day,index)=>{const number=index+1;const selected=days.includes(number);return <div key={day}><label className="check-row"><input type="checkbox" checked={selected} onChange={()=>setDays(current=>selected?current.filter(value=>value!==number):[...current,number])}/><span>{day}</span></label>{selected&&<div className="button-row" style={{padding:"0 0 14px 36px"}}><input className="input" name={`time-${number}`} aria-label={`${day} kickoff time`} type="time" defaultValue="18:00"/><input className="input" name={`venue-${number}`} aria-label={`${day} venue`} placeholder="Venue, optional"/></div>}</div>})}</fieldset>
    <fieldset disabled={pending}><legend className="field-label">Who can discover this group?</legend><label className="radio-row"><input type="radio" checked={visibility==="public"} onChange={()=>setVisibility("public")}/><span className="choice-copy"><strong>Public</strong><small>Your group can appear in Explore and people can view its public leaderboard.</small></span></label><label className="radio-row"><input type="radio" checked={visibility==="private"} onChange={()=>setVisibility("private")}/><span className="choice-copy"><strong>Private</strong><small>Your group stays out of Explore.</small></span></label></fieldset>
    <button className="button primary" disabled={pending}>{pending?"Creating…":"Create group"}</button>
  </form></>;
}
