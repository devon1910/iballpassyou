import { describe, expect, it } from "vitest";
import { shuffledTeamAssignments } from "./teams";

describe("shuffledTeamAssignments", () => {
  it("assigns every player and keeps teams balanced", () => {
    const ids = Array.from({ length: 25 }, (_, index) => `player-${index + 1}`);
    const assignments = shuffledTeamAssignments(ids, 5, () => 0.5);
    const sizes = Array.from({ length: 5 }, (_, team) =>
      [...assignments.values()].filter((assignedTeam) => assignedTeam === team).length,
    );

    expect(assignments.size).toBe(25);
    expect(sizes).toEqual([5, 5, 5, 5, 5]);
  });

  it("keeps uneven groups within one player of each other", () => {
    const ids = Array.from({ length: 13 }, (_, index) => `player-${index + 1}`);
    const assignments = shuffledTeamAssignments(ids, 4, () => 0.25);
    const sizes = Array.from({ length: 4 }, (_, team) =>
      [...assignments.values()].filter((assignedTeam) => assignedTeam === team).length,
    );

    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });
});
