import { describe, expect, it } from "vitest";
import { shareText } from "./format";
import type { Group, LeaderboardRow } from "@/types/domain";

const group = {
  id: "group-1",
  name: "Friday Ballers",
  timezone: "Africa/Lagos",
  defaultSessionFormat: "sets",
  visibility: "private",
  shareToken: "share-1",
  schedules: [],
  players: [],
  sessions: [],
} satisfies Group;

const row = (rank: number, name: string): LeaderboardRow => ({
  playerId: `player-${rank}`,
  rank,
  name,
  rating: 12 - rank,
  goals: rank,
  assists: rank + 1,
  appearances: rank + 2,
  sessionWins: rank - 1,
});

describe("shareText", () => {
  it("copies every player and every leaderboard stat", () => {
    const text = shareText(group, [row(1, "Ada"), row(2, "Bola"), row(3, "Chidi"), row(4, "Dele")], "ALL TIME");

    expect(text).toContain("🥇 Ada");
    expect(text).toContain("4. Dele");
    expect(text).toContain("4G 5A · 6 played · 3 won");
    expect(text).toContain("FRIDAY BALLERS · ALL TIME");
  });
});
