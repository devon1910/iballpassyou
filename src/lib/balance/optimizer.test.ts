import { describe, expect, it } from "vitest";
import { assignmentKey, generateBalancedTeams, searchBalancedTeams } from "./optimizer";
import { assessTeams, balanceCost, summarizeTeam } from "./scoring";
import type { BalancePlayer, BalanceRequest } from "./types";

const roster = (count: number): BalancePlayer[] => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, effectiveSkill: i % 5 + 1, primaryPosition: (["defender", "midfielder", "attacker"] as const)[i % 3], secondaryPosition: null, keeperCapable: i < 2 }));
function valid(request: BalanceRequest, result = generateBalancedTeams(request)) {
  expect(result.length).toBeGreaterThan(0);
  for (const option of result) {
    const ids = option.teams.flatMap(t => t.players.map(p => p.id));
    expect(ids.sort()).toEqual(request.players.map(p => p.id).sort());
    expect(new Set(ids).size).toBe(ids.length);
    const sizes = option.teams.map(t => t.players.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    for (const lock of request.locks) expect(option.teams[lock.teamIndex].players.some(p => p.id === lock.playerId)).toBe(true);
  }
}
describe("team balancing", () => {
  it("assigns ten selected players exactly once, 5v5, with minimum skill gap", () => {
    const request = { players: roster(10), teamCount: 2, locks: [] };
    const result = generateBalancedTeams(request); valid(request, result);
    expect(result[0].skillGap).toBe(0);
    expect(result[0].teams.map(t => t.players.length)).toEqual([5, 5]);
    expect(result[0].teams.every(t => t.hasKeeperCapability && t.coverage.defender > 0 && t.coverage.attacker > 0)).toBe(true);
  });
  it("returns deterministic, genuinely distinct options including ties", () => {
    const request = { players: roster(10).map(p => ({ ...p, effectiveSkill: 3 })), teamCount: 2, locks: [] };
    const result = generateBalancedTeams(request);
    expect(result).toHaveLength(3);
    expect(result).toEqual(generateBalancedTeams({ ...request, players: [...request.players].reverse() }));
    expect(new Set(result.map(r => assignmentKey(r.teams.map(t => t.players)))).size).toBe(3);
    expect(assignmentKey(result[0].teams.map(t => t.players))).toBe(assignmentKey(result[0].teams.map(t => t.players).reverse()));
  });
  it("degrades gracefully for position and keeper shortages", () => {
    const players = roster(9).map((p, i) => ({ ...p, primaryPosition: i < 2 ? "defender" as const : "attacker" as const, keeperCapable: i === 0 }));
    const request = { players, teamCount: 3, locks: [] };
    const result = generateBalancedTeams(request); valid(request, result);
    expect(result[0].warnings.map(w => w.code)).toEqual(expect.arrayContaining(["shortage_defender", "shortage_midfielder", "shortage_goalkeeper"]));
  });
  it("counts realistic secondary positions and goalkeeper primary positions", () => {
    const players = roster(4).map((p, i) => ({ ...p, primaryPosition: i < 2 ? "goalkeeper" as const : "attacker" as const, secondaryPosition: "defender" as const, keeperCapable: false }));
    const result = generateBalancedTeams({ players, teamCount: 2, locks: [] });
    expect(result[0].teams.every(t => t.hasKeeperCapability && t.coverage.defender > 0)).toBe(true);
  });
  it("respects multiple locks and gives the larger odd team to the required label", () => {
    const request = { players: roster(11), teamCount: 2, locks: Array.from({ length: 6 }, (_, i) => ({ playerId: `p${i}`, teamIndex: 1 })) };
    valid(request);
    expect(generateBalancedTeams(request)[0].teams.map(t => t.players.length)).toEqual([5, 6]);
  });
  it("rejects impossible or invalid locks usefully", () => {
    expect(() => generateBalancedTeams({ players: roster(10), teamCount: 2, locks: Array.from({ length: 6 }, (_, i) => ({ playerId: `p${i}`, teamIndex: 0 })) })).toThrow(/Locked assignments prevent even team sizes/);
    expect(() => generateBalancedTeams({ players: roster(10), teamCount: 2, locks: [{ playerId: "absent", teamIndex: 0 }] })).toThrow(/locked players/);
  });
  it("does not invent alternatives when every assignment is locked", () => {
    const request = { players: roster(4), teamCount: 2, locks: roster(4).map((p, i) => ({ playerId: p.id, teamIndex: i % 2 })) };
    const result = generateBalancedTeams(request); valid(request, result); expect(result).toHaveLength(1);
  });
  it("prefers healthier variance when totals and positions tie", () => {
    const make = (skills: number[]) => skills.map((effectiveSkill, i) => ({ ...roster(1)[0], id: String(i), effectiveSkill }));
    const stacked = [make([5, 5, 1, 1, 1]), make([3, 3, 3, 2, 2])];
    const spread = [make([5, 3, 2, 2, 1]), make([5, 3, 3, 1, 1])];
    expect(balanceCost(spread.map(summarizeTeam))).toBeLessThan(balanceCost(stacked.map(summarizeTeam)));
  });
  it("switches to a reproducible bounded heuristic", () => {
    const request = { players: roster(25), teamCount: 4, locks: [{ playerId: "p0", teamIndex: 3 }, { playerId: "p1", teamIndex: 0 }] };
    const result = searchBalancedTeams(request, { exactCandidateLimit: 1, seed: 42 });
    expect(result.strategy).toBe("heuristic"); valid(request, result.suggestions);
    expect(result).toEqual(searchBalancedTeams(request, { exactCandidateLimit: 1, seed: 42 }));
    expect(searchBalancedTeams({ players: roster(10), teamCount: 2, locks: [] }).strategy).toBe("exact");
  });
  it("scores manual edits instantly without disallowing unequal sizes", () => {
    const players = roster(10);
    expect(assessTeams([players.slice(0, 8), players.slice(8)]).quality).toBe("unbalanced");
  });
  it("handles the maximum session roster without dropping attendees", () => {
    const request = { players: roster(100), teamCount: 8, locks: [{ playerId: "p99", teamIndex: 7 }] };
    const result = searchBalancedTeams(request);
    expect(result.strategy).toBe("heuristic"); valid(request, result.suggestions);
  });
  it("centralizes quality thresholds for equal-sized manual teams", () => {
    const quality = (a: number[], b: number[]) => assessTeams([a, b].map(skills => skills.map((effectiveSkill, i) => ({ ...roster(1)[0], id: String(i), effectiveSkill })))).quality;
    expect(quality([3, 3], [3, 3])).toBe("excellent");
    expect(quality([4, 4], [3, 3])).toBe("good");
    expect(quality([5, 5], [3, 3])).toBe("fair");
    expect(quality([5, 5], [1, 1])).toBe("unbalanced");
  });
  it.each([0, 1, 3, 9, 2.5])("rejects nonsensical team count %s for two players", teamCount => {
    expect(() => generateBalancedTeams({ players: roster(2), teamCount, locks: [] })).toThrow(/Choose/);
  });
});
