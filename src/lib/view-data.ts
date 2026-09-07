import { aggregateLeaderboard } from "@/lib/rating";
import { periodSessions } from "@/lib/time";
import type { FootballSession, Group, LeaderboardPeriod } from "@/types/domain";

export function leaderboardFor(group: Group, period: LeaderboardPeriod, now = new Date()) {
  return aggregateLeaderboard(periodSessions(group.sessions, period, group.timezone, now));
}
export function getPeriod(value?: string): LeaderboardPeriod { return ["month","last_month","year","all"].includes(value ?? "") ? value as LeaderboardPeriod : "month"; }
export function playerSessions(group: Group, playerId: string): FootballSession[] { return group.sessions.filter((s) => s.appearances.some((a) => a.playerId === playerId)); }
