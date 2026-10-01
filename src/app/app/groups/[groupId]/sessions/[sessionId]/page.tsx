import { SessionAchievements } from "@/components/session-achievements";
import { SessionPlayerStats } from "@/components/session-player-stats";
import { SiteNav } from "@/components/site-nav";
import { getGroupOr404 } from "@/lib/data";
import { uniqueWinningTeamId } from "@/lib/rating";

export default async function SessionPage({ params }: PageProps<"/app/groups/[groupId]/sessions/[sessionId]">) {
  const { groupId, sessionId } = await params;
  const group = await getGroupOr404(groupId);
  const session = group.sessions.find((item) => item.id === sessionId);
  if (!session) return <main className="shell"><p className="empty">Session not found.</p></main>;
  const winner = uniqueWinningTeamId(session);

  return <main className="shell">
    <SiteNav backHref={`/app/groups/${groupId}`} />
    <div className="page-head">
      <p className="eyebrow">{group.name} · Session</p>
      <h1>{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: group.timezone }).format(new Date(session.kickoffAt)).toUpperCase()}</h1>
      <p className="schedule">{session.format.replace("_", " ")} · {session.appearances.length} played</p>
    </div>
    <SessionAchievements group={group} session={session} />
    {session.teams.length > 0 && <section>
      <p className="section-label">Result</p>
      <div className="list">{session.teams.map((team) => <div className="list-row" key={team.id}><strong>{team.label}{winner === team.id ? " (Winner)" : ""}</strong><b>{team.setWins}</b></div>)}</div>
    </section>}
    <section>
      <div className="section-row"><p className="section-label">Player stats</p></div>
      <SessionPlayerStats groupId={groupId} sessionId={sessionId} appearances={session.appearances} />
    </section>
  </main>;
}
