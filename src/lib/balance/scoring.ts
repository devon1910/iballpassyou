import { POSITIONS, type BalancePlayer, type BalanceWarning, type Quality, type TeamSuggestion, type TeamSummary } from "./types";

// Sizes are hard constraints during generation; this term also informs manual edits.
// Skill totals lead, coverage is meaningful, and variance is a modest tie breaker.
export const BALANCE_CONFIG = {
  weights: { size: 10000, skill: 20, position: 8, keeper: 16, spread: 2 },
  exactCandidateLimit: 20000,
  restarts: 16,
  improvementPasses: 12,
  swapBudget: 12000,
  retainedOptions: 24,
  nearBestAllowance: 48,
  quality: { excellentGap: 1, goodGap: 3, fairGap: 5, goodCoverage: 2, fairCoverage: 4,
    excellentSpread: 1, goodSpread: 2, fairSpread: 3 },
} as const;
const range = (values: number[]) => values.length ? Math.max(...values) - Math.min(...values) : 0;
const dispersion = (values: number[]) => {
  const mean = values.reduce((sum, n) => sum + n, 0) / Math.max(1, values.length);
  return values.reduce((sum, n) => sum + (n - mean) ** 2, 0);
};
export function summarizeTeam(players: BalancePlayer[]): TeamSummary {
  const totalSkill = players.reduce((sum, p) => sum + p.effectiveSkill, 0);
  const positionSummary = Object.fromEntries(POSITIONS.map(p => [p, players.filter(x => x.primaryPosition === p).length])) as TeamSummary["coverage"];
  const coverage = Object.fromEntries(POSITIONS.map(p => [p, players.filter(x => x.primaryPosition === p || x.secondaryPosition === p || (p === "goalkeeper" && x.keeperCapable)).length])) as TeamSummary["coverage"];
  return { players, totalSkill, positionSummary, coverage, hasKeeperCapability: coverage.goalkeeper > 0,
    variance: players.length ? players.reduce((sum, p) => sum + (p.effectiveSkill - totalSkill / players.length) ** 2, 0) / players.length : 0 };
}
function coveragePenalty(teams: TeamSummary[], position: typeof POSITIONS[number]) {
  const counts = teams.map(t => t.coverage[position]);
  const supply = counts.reduce((a, b) => a + b, 0);
  // A shortage itself is not penalized: only avoidable concentration is.
  const uncovered = Math.min(supply, teams.length) - counts.filter(n => n > 0).length;
  return dispersion(counts) + 2 * uncovered;
}
export function balanceCost(teams: TeamSummary[]): number {
  const w = BALANCE_CONFIG.weights;
  return w.size * Math.max(0, range(teams.map(t => t.players.length)) - 1) ** 2
    + w.skill * dispersion(teams.map(t => t.totalSkill))
    + w.spread * dispersion(teams.map(t => t.variance))
    + w.position * ["defender", "midfielder", "attacker"].reduce((sum, p) => sum + coveragePenalty(teams, p as "defender"), 0)
    + w.keeper * coveragePenalty(teams, "goalkeeper");
}
export function assessTeams(assignments: BalancePlayer[][], lockCounts: number[] = []): TeamSuggestion {
  const teams = assignments.map(summarizeTeam);
  const warnings: BalanceWarning[] = [];
  for (const position of POSITIONS) {
    const supply = teams.reduce((sum, team) => sum + team.coverage[position], 0);
    if (supply < teams.length) warnings.push({ code: `shortage_${position}`, message: `Only ${supply} ${position === "goalkeeper" ? "keeper" : position}-capable players are available for ${teams.length} teams.` });
  }
  const skillGap = range(teams.map(t => t.totalSkill));
  const spreadGap = range(teams.map(t => t.variance));
  const coverageGap = Math.max(0, ...POSITIONS.map(p => range(teams.map(t => t.coverage[p])) - 1));
  const q = BALANCE_CONFIG.quality;
  const positionQuality: Quality = coverageGap === 0 ? "excellent" : coverageGap <= q.goodCoverage ? "good" : coverageGap <= q.fairCoverage ? "fair" : "unbalanced";
  const quality: Quality = range(teams.map(t => t.players.length)) > 1 || teams.some(t => !t.players.length) ? "unbalanced"
    : skillGap <= q.excellentGap && coverageGap === 0 && spreadGap <= q.excellentSpread ? "excellent"
    : skillGap <= q.goodGap && coverageGap <= q.goodCoverage && spreadGap <= q.goodSpread ? "good"
    : skillGap <= q.fairGap && coverageGap <= q.fairCoverage && spreadGap <= q.fairSpread ? "fair" : "unbalanced";
  if (quality !== "excellent") lockCounts.forEach((count, index) => {
    if (count) warnings.push({ code: `locks_${index}`, message: `Balance may be limited by ${count} locked player${count === 1 ? "" : "s"} on team ${index + 1}.` });
  });
  return { teams, quality, positionQuality, skillGap, warnings };
}
