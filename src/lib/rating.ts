import { RATING } from "@/lib/config";
import type { Appearance, FootballSession, LeaderboardRow } from "@/types/domain";

export function uniqueWinningTeamId(session: Pick<FootballSession, "format" | "teams">): string | undefined {
  if (session.format === "none" || session.teams.length === 0) return undefined;
  const max = Math.max(...session.teams.map((team) => team.setWins));
  if (max <= 0) return undefined;
  const leaders = session.teams.filter((team) => team.setWins === max);
  return leaders.length === 1 ? leaders[0].id : undefined;
}

export function appearanceRating(appearance: Pick<Appearance, "goals" | "assists" | "teamId">, winnerId?: string) {
  return appearance.goals * RATING.GOAL + appearance.assists * RATING.ASSIST +
    (winnerId && appearance.teamId === winnerId ? RATING.SESSION_WIN : 0);
}

export function aggregateLeaderboard(sessions: FootballSession[]): LeaderboardRow[] {
  const totals = new Map<string, Omit<LeaderboardRow, "rank">>();
  for (const session of sessions) {
    const winnerId = uniqueWinningTeamId(session);
    for (const appearance of session.appearances) {
      const row = totals.get(appearance.playerId) ?? {
        playerId: appearance.playerId, name: appearance.playerName, goals: 0, assists: 0,
        appearances: 0, sessionWins: 0, rating: 0,
      };
      row.goals += appearance.goals;
      row.assists += appearance.assists;
      row.appearances += 1;
      const won = Boolean(winnerId && appearance.teamId === winnerId);
      row.sessionWins += won ? 1 : 0;
      row.rating += appearanceRating(appearance, winnerId);
      totals.set(appearance.playerId, row);
    }
  }
  const ordered = [...totals.values()].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  return ordered.map((row, index) => ({
    ...row,
    rank: index === 0 || row.rating !== ordered[index - 1].rating ? index + 1 : 0,
  })).map((row, index, rows) => ({ ...row, rank: row.rank || rows[index - 1].rank }));
}

