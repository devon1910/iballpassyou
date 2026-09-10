import { GroupHeading } from "@/components/group-heading";
import { PublicTable } from "@/components/public-table";
import { SessionCalendar } from "@/components/session-calendar";
import { SiteNav } from "@/components/site-nav";
import { SessionAchievements } from "@/components/session-achievements";
import { getGroupOr404 } from "@/lib/data";
import { getPeriod } from "@/lib/view-data";

export default async function FullLeaderboard({ params, searchParams }: PageProps<"/app/groups/[groupId]/leaderboard">) {
  const [{ groupId }, query] = await Promise.all([params, searchParams]);
  const group = await getGroupOr404(groupId);
  const period = getPeriod(typeof query.period === "string" ? query.period : undefined);
  const savedSession = query.saved === "1" && typeof query.session === "string" ? group.sessions.find(s => s.id === query.session) : undefined;

  return <main className="shell">
    <SiteNav backHref={`/app/groups/${groupId}`} />
    <GroupHeading group={group} />
    {savedSession && <><p className="notice" role="status">Session saved. Here are the standout performances.</p><SessionAchievements group={group} session={savedSession} reveal /></>}
    <SessionCalendar groupId={groupId} sessions={group.sessions} timezone={group.timezone} />
    <PublicTable group={group} period={period} base={`/app/groups/${groupId}/leaderboard`} playerBase={`/app/groups/${groupId}/players`} allowCopy />
  </main>;
}
