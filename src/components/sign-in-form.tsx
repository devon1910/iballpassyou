"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() { const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");try{const supabase=createClient();const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/auth/callback?next=/app`}});if(error)throw error;setMessage("Check your email for a secure sign-in link.");}catch{setMessage("Supabase is not configured yet. Use the demo below or add your environment keys.");}}; return <><form className="form-stack" onSubmit={submit}><label className="field"><span className="field-label">Email address</span><input className="input" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{message&&<p className="notice" role="status">{message}</p>}<button className="button primary">Email me a sign-in link</button></form><Link className="text-link" href="/app" style={{marginTop:22}}>Preview with demo data →</Link></>; }
