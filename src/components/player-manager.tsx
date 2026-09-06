"use client";
import { FormEvent,useState } from "react";
import type { Player } from "@/types/domain";
import { ActionOverlay } from "@/components/action-overlay";
import { addPlayerAction,setPlayerActiveAction } from "@/app/app/actions";

export function PlayerManager({initial,groupId}:{initial:Player[];groupId:string}){
  const [players,setPlayers]=useState(initial);const [name,setName]=useState("");const [error,setError]=useState("");const [pendingLabel,setPendingLabel]=useState("");
  const add=async(e:FormEvent)=>{e.preventDefault();const clean=name.trim();if(!clean)return;setError("");setPendingLabel(`Adding ${clean}`);const result=await addPlayerAction(groupId,clean);setPendingLabel("");if(!result.ok){setError(result.error);return}setPlayers(p=>[...p,{id:result.id,name:clean,active:true}]);setName("")};
  const toggle=async(player:Player)=>{setError("");setPendingLabel(`${player.active?"Deactivating":"Reactivating"} ${player.name}`);const result=await setPlayerActiveAction(groupId,player.id,!player.active);setPendingLabel("");if(!result.ok){setError(result.error);return}setPlayers(all=>all.map(x=>x.id===player.id?{...x,active:!x.active}:x))};
  const pending=Boolean(pendingLabel);return <><ActionOverlay active={pending} label={pendingLabel}/>{error&&<p className="notice error" role="alert">{error}</p>}<form className="button-row" onSubmit={add} aria-busy={pending}><input className="input" disabled={pending} value={name} onChange={e=>setName(e.target.value)} placeholder="Player name" aria-label="Player name"/><button className="button primary small" disabled={pending||!name.trim()}>Add</button></form><div className="list" style={{marginTop:24}}>{players.map(p=><div className="list-row" key={p.id}><div><strong>{p.name}</strong><span className="mono muted" style={{fontSize:10}}>{p.active?"Active":"Inactive"}</span></div><button className="text-link" disabled={pending} onClick={()=>toggle(p)}>{p.active?"Deactivate":"Reactivate"}</button></div>)}</div></>;
}
