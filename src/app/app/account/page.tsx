import { redirect } from "next/navigation";
import { SessionControls } from "@/components/session-controls";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/sign-in");
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  if (!userData.user) redirect("/auth/sign-in?error=session");
  const lastSignIn = userData.user.last_sign_in_at
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(userData.user.last_sign_in_at))
    : "This session";
  const refreshAt = sessionData.session?.expires_at
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(sessionData.session.expires_at * 1000))
    : undefined;

  return <main className="shell"><SiteNav backHref="/app" /><div className="page-head"><p className="eyebrow">Login sessions</p><h1>YOUR ACCOUNT</h1><p className="lede">See how you’re signed in and control access on this or other devices.</p></div><section className="account-summary"><span className="section-label">Signed in as</span><strong>{userData.user.email}</strong><dl><div><dt>Last sign-in</dt><dd>{lastSignIn}</dd></div><div><dt>Session</dt><dd>{refreshAt ? `Active · refreshes automatically around ${refreshAt}` : "Active · refreshes automatically"}</dd></div></dl></section><div className="section-row"><p className="section-label">Session controls</p></div><SessionControls /></main>;
}
