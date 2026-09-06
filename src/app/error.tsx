"use client";
import { useEffect } from "react";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className="shell"><div className="page-head"><p className="eyebrow">Something went wrong</p><h1>THE PAGE DIDN’T LOAD</h1><p className="lede">Your data has not been changed. Try the request again.</p></div><button className="button primary" onClick={reset}>Try again</button></main>}
