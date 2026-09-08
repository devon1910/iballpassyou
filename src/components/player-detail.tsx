import Link from "next/link";
import { appearanceRating, uniqueWinningTeamId } from "@/lib/rating";
import { leaderboardFor, playerSessions } from "@/lib/view-data";
import type { Group } from "@/types/domain";

export function PlayerDetail({ group, playerId, backHref }: { group: Group; playerId: string; backHref: string }) {
  const player = group.players.find((p) => p.id === playerId);
  if (!player) return <p className="empty">Player not found.</p>;
  const blocks = [["This month","month"],["This year","year"],["All time","all"]] as const;
  const history = playerSessions(group,playerId).sort((a,b) => b.kickoffAt.localeCompare(a.kickoffAt));
  return <><div className="page-head"><p className="eyebrow"><Link className="text-link" href={backHref}>← {group.name}</Link></p><h1>{player.name.toUpperCase()}</h1><p className="muted">{group.name}</p></div>
    {blocks.map(([label,period]) => { const row = leaderboardFor(group,period).find((r) => r.playerId === playerId); return <section key={period}><p className="section-label">{label}</p><div className="stats-grid">
      <div className="stat"><b>{row?.goals ?? 0}</b><span className="stat-label">Goals</span></div><div className="stat"><b>{row?.assists ?? 0}</b><span className="stat-label">Assists</span></div>
      <div className="stat"><b>{row?.appearances ?? 0}</b><span className="stat-label">Sessions</span></div><div className="stat"><b>{row?.sessionWins ?? 0}</b><span className="stat-label">Session wins</span></div>
      <div className="stat"><b>{row?.rating ?? 0}</b><span className="stat-label">Rating</span></div>
    </div></section>; })}
    <section><p className="section-label">Session history</p><div className="list">{history.map((session) => { const appearance = session.appearances.find((a) => a.playerId === playerId)!; const rating = appearanceRating(appearance,uniqueWinningTeamId(session)); return <div className="list-row" key={session.id}><span className="mono">{new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:group.timezone}).format(new Date(session.kickoffAt))}</span><span className="mono muted">{appearance.goals}G {appearance.assists}A</span><b>{rating}</b></div>; })}</div></section>
  </>;
}
