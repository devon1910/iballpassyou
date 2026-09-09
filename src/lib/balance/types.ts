export const POSITIONS = ["goalkeeper", "defender", "midfielder", "attacker"] as const;
export type Position = typeof POSITIONS[number];
export type BalancingProfile = {
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  keeperCapable: boolean;
  skillLevel: number | null;
};
export type BalancePlayer = Omit<BalancingProfile, "skillLevel"> & { id: string; effectiveSkill: number };
export type LockedAssignment = { playerId: string; teamIndex: number };
export type BalanceRequest = { players: BalancePlayer[]; teamCount: number; locks: LockedAssignment[] };
export type BalanceWarning = { code: string; message: string };
export type Quality = "excellent" | "good" | "fair" | "unbalanced";
export type TeamSummary = {
  players: BalancePlayer[];
  totalSkill: number;
  variance: number;
  positionSummary: Record<Position, number>;
  coverage: Record<Position, number>;
  hasKeeperCapability: boolean;
};
export type TeamSuggestion = { teams: TeamSummary[]; quality: Quality; positionQuality: Quality; skillGap: number; warnings: BalanceWarning[] };
export const EMPTY_PROFILE: BalancingProfile = { primaryPosition: null, secondaryPosition: null, keeperCapable: false, skillLevel: null };
