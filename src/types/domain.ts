export type SessionFormat = "none" | "fixed_teams" | "sets";
export type Visibility = "private" | "public";
export type LeaderboardPeriod = "month" | "last_month" | "year" | "all";

export interface Schedule {
  id: string;
  dayOfWeek: number;
  kickoffTime: string;
  venue?: string;
  active: boolean;
}

export interface Player {
  id: string;
  name: string;
  active: boolean;
}

export interface Team {
  id: string;
  label: string;
  setWins: number;
}

export interface Appearance {
  playerId: string;
  playerName: string;
  teamId?: string;
  goals: number;
  assists: number;
}

export interface FootballSession {
  id: string;
  clientSessionId: string;
  kickoffAt: string;
  format: SessionFormat;
  teams: Team[];
  appearances: Appearance[];
}

export interface Group {
  id: string;
  name: string;
  timezone: string;
  defaultSessionFormat: SessionFormat;
  visibility: Visibility;
  publicSlug?: string;
  shareToken: string;
  schedules: Schedule[];
  players: Player[];
  sessions: FootballSession[];
}

export interface LeaderboardRow {
  playerId: string;
  name: string;
  goals: number;
  assists: number;
  appearances: number;
  sessionWins: number;
  rating: number;
  rank: number;
}
