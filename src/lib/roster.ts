import type { Player } from "@/types/domain";
const INVISIBLE_CHAT_MARKS = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/gu;
const trimEdges=(value:string)=>value.replace(INVISIBLE_CHAT_MARKS,"").replace(/^\s*(?:\d+[.)]|[-*•▪◦]|✅|☑️|⚽)\s*/u,"").replace(/[\s,;:!?.✅☑️⚽]+$/gu,"").trim();
export function parseRoster(input:string){return input.split(/\r?\n|,/).map(trimEdges).filter(Boolean)}
export const rosterNameKey=(value:string)=>value.normalize("NFKD").replace(INVISIBLE_CHAT_MARKS,"").replace(/[^\p{L}\p{N}]+/gu,"").toLocaleLowerCase();
export function matchRoster(input:string,players:Player[]){return parseRoster(input).map(name=>{const candidates=players.filter(p=>p.active&&rosterNameKey(p.name)===rosterNameKey(name));return candidates.length===1?{input:name,status:"matched" as const,player:candidates[0]}:{input:name,status:candidates.length>1?"ambiguous" as const:"unmatched" as const}})}

export interface DraftRosterPlayer {
  id: string; name: string; selected: boolean; team: number; goals: number; assists: number; isNew?: boolean;
}

export function applyPastedRoster<T extends DraftRosterPlayer>(input: string, draftPlayers: T[], groupPlayers: Player[]) {
  const matched = matchRoster(input, groupPlayers);
  const ambiguous = matched.filter(row => row.status === "ambiguous");
  if (ambiguous.length) return { players: draftPlayers, ambiguous };
  const requested = new Map(matched.map(row => [rosterNameKey(row.input), row]));
  const players: DraftRosterPlayer[] = draftPlayers.map(player => {
    const row = requested.get(rosterNameKey(player.name));
    const selected = row?.status === "matched"
      ? row.player.id === player.id
      : row?.status === "unmatched" && Boolean(player.isNew);
    return selected ? { ...player, selected: true } : player;
  });
  const presentNames = new Set(players.map(player => rosterNameKey(player.name)));
  for (const row of matched) {
    const nameKey = rosterNameKey(row.input);
    if (row.status !== "unmatched" || presentNames.has(nameKey)) continue;
    players.push({ id: `new-${nameKey || `player-${players.length + 1}`}`, name: row.input, selected: true, team: 0, goals: 0, assists: 0, isNew: true });
    presentNames.add(nameKey);
  }
  return { players: players as T[], ambiguous };
}
