import { aggregateLeaderboard } from "@/lib/rating";
import { periodSessions } from "@/lib/time";
import type { FootballSession, Group, LeaderboardPeriod } from "@/types/domain";

export function leaderboardFor(group: Group, period: LeaderboardPeriod, now = new Date("2026-09-06T12:00:00Z")) {
  return aggregateLeaderboard(periodSessions(group.sessions, period, group.timezone, now));
}
export function getPeriod(value?: string): LeaderboardPeriod { return ["latest","month","year","all"].includes(value ?? "") ? value as LeaderboardPeriod : "month"; }
export function playerSessions(group: Group, playerId: string): FootballSession[] { return group.sessions.filter((s) => s.appearances.some((a) => a.playerId === playerId)); }
