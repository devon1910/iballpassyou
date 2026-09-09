import { aggregateLeaderboard, appearanceRating, uniqueWinningTeamId } from "@/lib/rating";
import type { FootballSession, Group, SessionFormat } from "@/types/domain";

export const FORMAT_LABELS: Record<SessionFormat, string> = {
  none: "No teams", fixed_teams: "Fixed teams", sets: "Set play",
};

function monthKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", timeZone: timezone }).formatToParts(date);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}

export function sessionMotm(session: FootballSession) {
  return aggregateLeaderboard([session]).filter(row => row.rank === 1 && row.rating > 0);
}

export function monthlyMvps(group: Group, now = new Date()) {
  const currentMonth = monthKey(now, group.timezone);
  const months = new Map<string, FootballSession[]>();
  for (const session of group.sessions) {
    const month = monthKey(new Date(session.kickoffAt), group.timezone);
    if (month >= currentMonth) continue;
    months.set(month, [...(months.get(month) ?? []), session]);
  }
  return [...months.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, sessions]) => ({
    month,
    label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`)),
    winners: aggregateLeaderboard(sessions).filter(row => row.rank === 1 && row.rating > 0),
  }));
}

export function sessionRecord(group: Group, session: FootballSession, playerId: string) {
  const appearance = session.appearances.find(a => a.playerId === playerId);
  if (!appearance) return undefined;
  const points = appearanceRating(appearance, uniqueWinningTeamId(session));
  const previous = group.sessions.filter(s => s.format === session.format && new Date(s.kickoffAt).getTime() < new Date(session.kickoffAt).getTime())
    .flatMap(s => s.appearances.filter(a => a.playerId === playerId).map(a => appearanceRating(a, uniqueWinningTeamId(s))));
  const previousBest = previous.length ? Math.max(...previous) : undefined;
  const kind = previousBest === undefined ? "baseline" : points > previousBest ? "broken" : points === previousBest ? "matched" : undefined;
  return { points, previousBest, kind };
}

export function playerHonours(group: Group, playerId: string, now = new Date()) {
  const sessions = group.sessions.filter(s => new Date(s.kickoffAt) <= now && s.appearances.some(a => a.playerId === playerId))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime() || a.id.localeCompare(b.id));
  const motm = sessions.filter(s => sessionMotm(s).some(w => w.playerId === playerId));
  const mvp = monthlyMvps(group, now).filter(m => m.winners.some(w => w.playerId === playerId));
  const bests = new Map<SessionFormat, { session: FootballSession; points: number }>();
  for (const session of sessions) {
    const appearance = session.appearances.find(a => a.playerId === playerId)!;
    const points = appearanceRating(appearance, uniqueWinningTeamId(session));
    const best = bests.get(session.format);
    if (!best || points > best.points) bests.set(session.format, { session, points });
  }
  return { motm: motm.reverse(), mvp, bests: [...bests.values()] };
}
