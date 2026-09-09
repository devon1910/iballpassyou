import { describe, expect, it } from "vitest";
import { leaderboardImagePages, leaderboardPeriodLabel } from "./leaderboard-image";
import type { LeaderboardRow } from "@/types/domain";

describe("leaderboard graphics", () => {
  it("includes every player without changing tied ranks or stats across cards", () => {
    const rows: LeaderboardRow[] = Array.from({ length: 23 }, (_, i) => ({ playerId: String(i), name: `Player ${i}`, rank: i === 10 ? 10 : i + 1, goals: 20 - i, assists: i, appearances: 4, sessionWins: 2, rating: 100 - i }));
    const pages = leaderboardImagePages(rows);
    expect(pages.map(p => p.length)).toEqual([10, 10, 3]);
    expect(pages.flat()).toEqual(rows);
    expect(pages[1][0].rank).toBe(10);
    expect(leaderboardImagePages([])).toEqual([]);
  });
  it("names the actual calendar period in the group's timezone", () => {
    const now = new Date("2026-12-31T23:30:00Z");
    expect(leaderboardPeriodLabel("month", "Africa/Lagos", now)).toBe("January 2027");
    expect(leaderboardPeriodLabel("last_month", "Africa/Lagos", now)).toBe("December 2026");
    expect(leaderboardPeriodLabel("year", "Africa/Lagos", now)).toBe("2027");
    expect(leaderboardPeriodLabel("all", "Africa/Lagos", now)).toBe("All time");
  });
});
