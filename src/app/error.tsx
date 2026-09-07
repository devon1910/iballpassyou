"use client";
import { useEffect, useTransition } from "react";
import { ActionOverlay } from "@/components/action-overlay";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){const [pending,startTransition]=useTransition();useEffect(()=>{console.error(error)},[error]);return <main className="shell"><ActionOverlay active={pending} label="Trying again"/><div className="page-head"><p className="eyebrow">Something went wrong</p><h1>THE PAGE DIDN’T LOAD</h1><p className="lede">Your data has not been changed. Try the request again.</p></div><button className="button primary" disabled={pending} onClick={()=>startTransition(reset)}>Try again</button></main>}
