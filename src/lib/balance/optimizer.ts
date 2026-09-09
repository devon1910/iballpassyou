import { assessTeams, balanceCost, BALANCE_CONFIG, summarizeTeam } from "./scoring";
import { POSITIONS, type BalancePlayer, type BalanceRequest, type TeamSuggestion } from "./types";

export function assignmentKey(teams: BalancePlayer[][]): string {
  // Team labels do not make a new football arrangement, even with locks.
  return JSON.stringify(teams.map(t => t.map(p => p.id).sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
}
function choose(n: number, k: number, cap: number) {
  let value = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) { value = value * (n - i + 1) / i; if (value > cap) return cap + 1; }
  return Math.round(value);
}
export type SearchSettings = { exactCandidateLimit?: number; seed?: number };
export function searchBalancedTeams(request: BalanceRequest, settings: SearchSettings = {}) {
  const { teamCount: k } = request;
  const players = [...request.players].sort((a, b) => a.id.localeCompare(b.id));
  if (!Number.isInteger(k) || k < 2 || k > 8 || k > players.length) throw new Error("Choose 2–8 teams, with at least one selected player per team.");
  if (players.length > 100) throw new Error("Balance up to 100 selected players at a time.");
  if (new Set(players.map(p => p.id)).size !== players.length) throw new Error("Each selected player must appear only once.");
  if (players.some(p => !Number.isFinite(p.effectiveSkill) || p.effectiveSkill < 1 || p.effectiveSkill > 5 || !POSITIONS.includes(p.primaryPosition!) || (p.secondaryPosition !== null && !POSITIONS.includes(p.secondaryPosition)))) throw new Error("Complete position and Skill Level (1–5) for every selected player.");
  const locked = new Map<string, number>();
  for (const lock of request.locks) {
    if (!players.some(p => p.id === lock.playerId) || !Number.isInteger(lock.teamIndex) || lock.teamIndex < 0 || lock.teamIndex >= k || locked.has(lock.playerId)) throw new Error("Check locked players and their team assignments.");
    locked.set(lock.playerId, lock.teamIndex);
  }
  const baseTeams = Array.from({ length: k }, (_, t) => players.filter(p => locked.get(p.id) === t));
  const free = players.filter(p => !locked.has(p.id));
  const small = Math.floor(players.length / k), extras = players.length % k;
  // Enumerate which labeled teams get the extra player; locks may require a particular one.
  const capacities: number[][] = [];
  for (let mask = 0; mask < 2 ** k; mask++) {
    const sizes = Array.from({ length: k }, (_, i) => small + ((mask >> i) & 1));
    if (sizes.reduce((a, b) => a + b, 0) === small * k + extras && sizes.every((n, i) => n >= baseTeams[i].length)) capacities.push(sizes);
  }
  if (!capacities.length) throw new Error("Locked assignments prevent even team sizes. Unlock a player or choose a different team count.");
  const limit = settings.exactCandidateLimit ?? BALANCE_CONFIG.exactCandidateLimit;
  let candidateCount = 0;
  for (const sizes of capacities) {
    let remaining = free.length, count = 1;
    for (let t = 0; t < k; t++) { const needed = sizes[t] - baseTeams[t].length; count *= choose(remaining, needed, limit); remaining -= needed; if (count > limit) break; }
    candidateCount += count;
    if (candidateCount > limit) break;
  }
  const exact = candidateCount <= limit;
  const best: { key: string; cost: number; teams: BalancePlayer[][] }[] = [];
  const retain = (teams: BalancePlayer[][]) => {
    const cost = balanceCost(teams.map(summarizeTeam));
    if (best.length >= BALANCE_CONFIG.retainedOptions && cost > best[best.length - 1].cost) return;
    const key = assignmentKey(teams);
    if (best.some(c => c.key === key)) return;
    best.push({ key, cost, teams: teams.map(t => [...t]) });
    best.sort((a, b) => a.cost - b.cost || a.key.localeCompare(b.key));
    if (best.length > BALANCE_CONFIG.retainedOptions) best.pop();
  };
  if (exact) {
    for (const sizes of capacities) {
      const teams = baseTeams.map(t => [...t]);
      const enumerate = (index: number) => {
        if (index === free.length) { retain(teams); return; }
        for (let t = 0; t < k; t++) if (teams[t].length < sizes[t]) {
          // Empty interchangeable teams need only one representative.
          if (!teams[t].length && teams.some((other, j) => j < t && !other.length && sizes[j] === sizes[t])) continue;
          teams[t].push(free[index]); enumerate(index + 1); teams[t].pop();
        }
      };
      enumerate(0);
    }
  } else {
    let seed = (settings.seed ?? 1) >>> 0;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    let remainingSwaps = BALANCE_CONFIG.swapBudget;
    for (let restart = 0; restart < BALANCE_CONFIG.restarts; restart++) {
      const sizes = capacities[restart % capacities.length];
      const teams = baseTeams.map(t => [...t]);
      const order = free.map(p => ({ p, tie: random() })).sort((a, b) => b.p.effectiveSkill - a.p.effectiveSkill || a.tie - b.tie);
      for (const { p } of order) {
        const choices = teams.map((team, t) => ({ t, total: team.reduce((s, x) => s + x.effectiveSkill, 0), tie: random() })).filter(x => teams[x.t].length < sizes[x.t]);
        choices.sort((a, b) => a.total - b.total || a.tie - b.tie);
        teams[choices[0].t].push(p);
      }
      const summaries = teams.map(summarizeTeam);
      let cost = balanceCost(summaries);
      for (let pass = 0; pass < BALANCE_CONFIG.improvementPasses && remainingSwaps > 0; pass++) {
        let improved = false;
        outer: for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) for (let i = 0; i < teams[a].length; i++) for (let j = 0; j < teams[b].length; j++) {
          if (locked.has(teams[a][i].id) || locked.has(teams[b][j].id)) continue;
          if (--remainingSwaps < 0) break outer;
          [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]];
          // Only the two changed teams need new summaries, especially for 8-team rosters.
          const previousA = summaries[a], previousB = summaries[b];
          summaries[a] = summarizeTeam(teams[a]); summaries[b] = summarizeTeam(teams[b]);
          const next = balanceCost(summaries);
          if (next < cost - 0.001) { cost = next; improved = true; }
          else {
            [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]];
            summaries[a] = previousA; summaries[b] = previousB;
          }
        }
        if (!improved) break;
      }
      retain(teams);
    }
  }
  const candidates = best.filter(c => c.cost <= best[0].cost + BALANCE_CONFIG.nearBestAllowance);
  return { strategy: exact ? "exact" as const : "heuristic" as const,
    suggestions: candidates.map(c => assessTeams(c.teams, baseTeams.map(t => t.length))) };
}
export function generateBalancedTeams(request: BalanceRequest, settings?: SearchSettings): TeamSuggestion[] {
  return searchBalancedTeams(request, settings).suggestions.slice(0, 3);
}
