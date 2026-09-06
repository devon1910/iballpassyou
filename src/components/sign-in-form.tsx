"use client";
import { FormEvent,useState } from "react";
import Link from "next/link";
import { ActionOverlay } from "@/components/action-overlay";
import { createClient } from "@/lib/supabase/client";

export function SignInForm(){
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);
  const [pending,setPending]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");setIsError(false);setPending(true);try{const supabase=createClient();const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/auth/callback?next=/app`}});if(error)throw error;setMessage("Check your email for a secure sign-in link.")}catch{setIsError(true);setMessage("Couldn’t send the sign-in link. Check the address and try again.")}finally{setPending(false)}};
  return <><ActionOverlay active={pending} label="Sending sign-in link"/><form className="form-stack" onSubmit={submit} aria-busy={pending}><label className="field"><span className="field-label">Email address</span><input className="input" required disabled={pending} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{message&&<p className={`notice ${isError?"error":""}`} role={isError?"alert":"status"}>{message}</p>}<button className="button primary" disabled={pending}>{pending?"Sending…":"Email me a sign-in link"}</button></form><Link className="text-link" href="/app" style={{marginTop:22}}>Preview with demo data →</Link></>;
}
