import { parseRoster } from "./roster";

export function shuffledTeamAssignments(
  playerIds: string[],
  teamCount: number,
  random: () => number = Math.random,
) {
  if (teamCount < 1) return new Map<string, number>();

  const shuffled = [...playerIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapWith]] = [shuffled[swapWith], shuffled[index]];
  }

  return new Map(shuffled.map((playerId, index) => [playerId, index % teamCount]));
}

export function unassignedPlayersLabel(names: string[]) {
  if (names.length === 1) return `${names[0]} is unassigned.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are unassigned.`;
  return `${names.length} unassigned`;
}

export type ParsedTeamSheet = {
  teams: { label: string; names: string[] }[];
  errors: string[];
};

export function parseTeamSheet(input: string): ParsedTeamSheet {
  const teams: ParsedTeamSheet["teams"] = [];
  const errors: string[] = [];
  let current: ParsedTeamSheet["teams"][number] | undefined;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon > 0) {
      const label = line.slice(0, colon).trim();
      if (!label || label.length > 40) {
        errors.push(`Invalid team heading: ${line}`);
        current = undefined;
        continue;
      }
      current = { label, names: [] };
      teams.push(current);
      current.names.push(...parseRoster(line.slice(colon + 1)));
      continue;
    }
    if (!current) {
      errors.push(`Add a team heading before “${line}”.`);
      continue;
    }
    current.names.push(...parseRoster(line));
  }

  const normalizedLabels = teams.map((team) => team.label.toLocaleLowerCase());
  if (new Set(normalizedLabels).size !== normalizedLabels.length) errors.push("Team headings must be unique.");
  if (teams.length < 2) errors.push("Add at least two team headings ending with a colon.");
  if (teams.length > 8) errors.push("A session can have at most eight teams.");
  return { teams, errors };
}
