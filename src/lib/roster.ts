import type { Player } from "@/types/domain";
const trimEdges=(value:string)=>value.replace(/^\s*(?:\d+[.)]|[-*•▪◦]|✅|☑️|⚽)\s*/u,"").replace(/[\s,;:!?.✅☑️⚽]+$/gu,"").trim();
export function parseRoster(input:string){return input.split(/\r?\n|,/).map(trimEdges).filter(Boolean)}
const normalize=(value:string)=>value.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu,"").toLocaleLowerCase();
export function matchRoster(input:string,players:Player[]){return parseRoster(input).map(name=>{const candidates=players.filter(p=>p.active&&normalize(p.name)===normalize(name));return candidates.length===1?{input:name,status:"matched" as const,player:candidates[0]}:{input:name,status:candidates.length>1?"ambiguous" as const:"unmatched" as const}})}
