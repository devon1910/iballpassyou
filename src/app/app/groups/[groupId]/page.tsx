import Link from "next/link";
import { GroupHeading } from "@/components/group-heading";
import { Leaderboard } from "@/components/leaderboard";
import { SiteNav } from "@/components/site-nav";
import { leaderboardFor } from "@/lib/view-data";
import { getGroupOr404 } from "@/lib/data";

export default async function GroupHome({ params }: PageProps<"/app/groups/[groupId]">) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);
  const rows = leaderboardFor(group, "month");
  const latest = [...group.sessions].sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))[0];
  const configured = group.players.filter(player => player.active && player.balancing?.primaryPosition && player.balancing.skillLevel).length;
  const active = group.players.filter(player => player.active).length;
  return <main className="shell">
    <SiteNav backHref="/app" />
    <GroupHeading group={group} />
    <Link className="button primary hero-action" href={`/app/groups/${group.id}/log`}>Log session</Link>
    <section className="balance-promo" aria-labelledby="balance-promo-title">
      <p className="eyebrow">Team balancing</p>
      <h2 id="balance-promo-title">Fair teams, without the argument</h2>
      <p>Select who is playing, then get up to three team suggestions based on position, keeper coverage, and a private 1–5 Skill Level.</p>
      <p className="balance-promo-note">You choose the players. You can move or swap anyone before continuing.</p>
      <div className="balance-promo-actions">
        <Link className="button" href={`/app/groups/${group.id}/log`}>Balance today’s teams</Link>
        <Link className="text-link" href={`/app/groups/${group.id}/players`}>{configured}/{active} player profiles ready</Link>
      </div>
    </section>
    <div className="section-row"><p className="section-label">September</p><Link className="text-link" href={`/app/groups/${group.id}/leaderboard`}>Full leaderboard</Link></div>
    <Leaderboard rows={rows} limit={3} playerHref={id => `/app/groups/${group.id}/players/${id}`} />
    <div className="section-row"><p className="section-label">Latest session</p></div>
    {latest ? <Link className="list-row" href={`/app/groups/${group.id}/sessions/${latest.id}`}><div><strong>{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: group.timezone }).format(new Date(latest.kickoffAt))}</strong><span className="schedule"> {latest.appearances.length} played</span></div><span className="arrow">→</span></Link> : <p className="empty">No sessions yet. Log the first one.</p>}
    <div className="button-row" style={{ marginTop: 24 }}><Link className="text-link" href={`/app/groups/${group.id}/players`}>Manage players</Link><Link className="text-link" href={`/app/groups/${group.id}/settings`}>Settings</Link></div>
  </main>;
}
