"use client";
import { FormEvent,useState } from "react";
import { InlineSpinner } from "@/components/inline-spinner";
import { createClient } from "@/lib/supabase/client";

export function SignInForm({nextPath="/app",initialMessage="",initialError=false}:{nextPath?:string;initialMessage?:string;initialError?:boolean}){
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState(initialMessage);
  const [isError,setIsError]=useState(initialError);
  const [pending,setPending]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");setIsError(false);setPending(true);try{const supabase=createClient();const callback=new URL("/auth/callback",location.origin);callback.searchParams.set("next",nextPath);const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:callback.toString()}});if(error)throw error;setMessage("Check your email for a secure sign-in link.")}catch{setIsError(true);setMessage("Couldn’t send the sign-in link. Check the address and try again.")}finally{setPending(false)}};
  return <form className="form-stack" onSubmit={submit} aria-busy={pending}><label className="field"><span className="field-label">Email address</span><input className="input" required disabled={pending} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{message&&<p className={`notice ${isError?"error":""}`} role={isError?"alert":"status"}>{message}</p>}<button className="button primary" disabled={pending}>{pending&&<InlineSpinner/>}{pending?"Sending…":"Email me a sign-in link"}</button></form>;
}
