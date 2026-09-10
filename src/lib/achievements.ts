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

export interface SessionMilestone {
  playerId: string;
  playerName: string;
  points: number;
  goals: number;
  assists: number;
  clause: string;
}

/**
 * Genuine, data-derived milestones for the session receipt. A player gets at
 * most one row: the first matching clause wins, keeping the receipt short and
 * preventing a single performance from becoming filler copy.
 */
export function sessionMilestones(group: Group, session: FootballSession, excludedPlayerIds: string[] = []) {
  const excluded = new Set(excludedPlayerIds);
  const chronological = [...group.sessions].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime() || a.id.localeCompare(b.id));
  const currentTime = new Date(session.kickoffAt).getTime();
  const priorSessions = chronological.filter((candidate) => new Date(candidate.kickoffAt).getTime() < currentTime);
  const currentIndex = chronological.findIndex((candidate) => candidate.id === session.id);
  const maxGoals = Math.max(0, ...session.appearances.map((appearance) => appearance.goals));
  const maxAssists = Math.max(0, ...session.appearances.map((appearance) => appearance.assists));
  const milestones: SessionMilestone[] = [];

  for (const appearance of session.appearances) {
    if (excluded.has(appearance.playerId)) continue;
    const playerPrior = priorSessions.filter((candidate) => candidate.appearances.some((item) => item.playerId === appearance.playerId));
    const priorAppearances = playerPrior.flatMap((candidate) => candidate.appearances.filter((item) => item.playerId === appearance.playerId));
    const points = appearanceRating(appearance, uniqueWinningTeamId(session));
    const priorGoals = priorAppearances.reduce((total, item) => total + item.goals, 0);
    const previousRatings = playerPrior
      .filter((candidate) => candidate.format === session.format)
      .flatMap((candidate) => candidate.appearances.filter((item) => item.playerId === appearance.playerId).map((item) => appearanceRating(item, uniqueWinningTeamId(candidate))));

    let clause: string | undefined;
    if (appearance.goals > 0 && priorGoals === 0) {
      clause = "FIRST GOAL FOR THE GROUP";
    } else {
      let scoringRun = 0;
      const end = currentIndex >= 0 ? currentIndex : chronological.length;
      for (let index = end; index >= 0; index -= 1) {
        const candidate = chronological[index];
        if (!candidate || new Date(candidate.kickoffAt).getTime() > currentTime) continue;
        const candidateAppearance = candidate.appearances.find((item) => item.playerId === appearance.playerId);
        if (!candidateAppearance || candidateAppearance.goals <= 0) break;
        scoringRun += 1;
      }
      if (scoringRun >= 3) clause = `SCORED IN ${scoringRun} STRAIGHT`;
      else if (previousRatings.length && points > Math.max(...previousRatings)) clause = `BEST RATING YET · ${points}`;
      else if (appearance.assists > 0 && appearance.assists === maxAssists) clause = `${appearance.assists} ASSISTS · SESSION HIGH`;
      else if (appearance.goals > 0 && appearance.goals === maxGoals) clause = `${appearance.goals} GOALS · SESSION HIGH`;
    }
    if (clause) milestones.push({ playerId: appearance.playerId, playerName: appearance.playerName, points, goals: appearance.goals, assists: appearance.assists, clause });
  }
  return milestones.slice(0, 4);
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
