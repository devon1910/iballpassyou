import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { SignInForm } from "@/components/sign-in-form";
import { safeAppPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";
export const metadata={title:"Sign in"};
export default async function SignInPage({searchParams}:PageProps<"/auth/sign-in">){const query=await searchParams;const nextPath=safeAppPath(query.next);const supabase=await createClient();if(supabase){const {data:{user}}=await supabase.auth.getUser();if(user)redirect(nextPath)}const error=typeof query.error==="string"?query.error:"";const signedOut=query.signedOut==="1";const initialMessage=signedOut?"You’ve been signed out on this device.":error==="link"?"That sign-in link is invalid or has expired. Request a new one.":error==="session"?"Your login session has expired. Sign in again to continue.":"";return <main className="shell"><div style={{paddingTop:28}}><Brand/></div><div className="page-head"><p className="eyebrow">Owners and admins</p><h1>SIGN IN</h1><p className="lede">No password. We’ll email you a one-time sign-in link.</p></div><SignInForm nextPath={nextPath} initialMessage={initialMessage} initialError={Boolean(error)}/></main>;}
