import Link from "next/link";
import { GroupHeading } from "@/components/group-heading";
import { Leaderboard } from "@/components/leaderboard";
import { SiteNav } from "@/components/site-nav";
import { leaderboardFor } from "@/lib/view-data";
import { getGroupOr404 } from "@/lib/data";

export default async function GroupHome({ params }: PageProps<"/app/groups/[groupId]">) { const { groupId } = await params; const group = await getGroupOr404(groupId); const rows = leaderboardFor(group,"month"); const latest = [...group.sessions].sort((a,b) => b.kickoffAt.localeCompare(a.kickoffAt))[0]; return <main className="shell"><SiteNav backHref="/app" /><GroupHeading group={group} /><Link className="button primary hero-action" href={`/app/groups/${group.id}/log`}>Log session</Link><div className="section-row"><p className="section-label">September</p><Link className="text-link" href={`/app/groups/${group.id}/leaderboard`}>Full leaderboard</Link></div><Leaderboard rows={rows} limit={3} playerHref={(id) => `/app/groups/${group.id}/players/${id}`} />
  <div className="section-row"><p className="section-label">Latest session</p></div>{latest ? <Link className="list-row" href={`/app/groups/${group.id}/sessions/${latest.id}`}><div><strong>{new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"short",timeZone:group.timezone}).format(new Date(latest.kickoffAt))}</strong><span className="schedule"> {latest.appearances.length} played</span></div><span className="arrow">→</span></Link> : <p className="empty">No sessions yet. Log the first one.</p>}
  <div className="button-row" style={{marginTop:24}}><Link className="text-link" href={`/app/groups/${group.id}/players`}>Manage players</Link><Link className="text-link" href={`/app/groups/${group.id}/settings`}>Settings</Link></div></main>; }
