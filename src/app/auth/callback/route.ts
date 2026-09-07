import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAppPath } from "@/lib/navigation";
function redirectWithoutCaching(url: URL) { const response = NextResponse.redirect(url); response.headers.set("Cache-Control", "no-store, max-age=0"); response.headers.set("Referrer-Policy", "no-referrer"); return response; }
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get("code");const next=safeAppPath(url.searchParams.get("next"));const supabase=await createClient();if(code&&supabase){const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return redirectWithoutCaching(new URL(next,url.origin));}return redirectWithoutCaching(new URL("/auth/sign-in?error=link",url.origin));}
