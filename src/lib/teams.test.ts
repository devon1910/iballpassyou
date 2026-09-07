import { describe, expect, it } from "vitest";
import { parseTeamSheet, shuffledTeamAssignments } from "./teams";

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

describe("parseTeamSheet", () => {
  it("reads multiline and inline grouped teams", () => {
    expect(parseTeamSheet("Red:\nAda\nBola\n\nBlue: Chidi, Dele")).toEqual({
      teams: [
        { label: "Red", names: ["Ada", "Bola"] },
        { label: "Blue", names: ["Chidi", "Dele"] },
      ],
      errors: [],
    });
  });

  it("requires explicit headings", () => {
    const result = parseTeamSheet("Ada\nBola");
    expect(result.teams).toEqual([]);
    expect(result.errors).toContain("Add at least two team headings ending with a colon.");
  });
});
