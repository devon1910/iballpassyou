import { config } from "dotenv";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

type OldPlayer = { id: string; name: string };
type OldSession = { id: string; session_date: string };
type OldStat = { session_id: string; player_id: string; goals: number; assists: number };

const aliases: Record<string, string> = { chappy: "Chappy", agbaso: "Chappy", kola: "Chappy", senna: "Senna", cena: "Senna", ceena: "Senna" };

async function main() {
  const dryRun = new Set(process.argv.slice(2)).has("--dry-run");
  const oldUrl = process.env.SPARTAN_SUPABASE_URL;
  const oldKey = process.env.SPARTAN_SUPABASE_SERVICE_ROLE_KEY;
  const nextUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const nextKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!oldUrl || !oldKey || !nextUrl || !nextKey) throw new Error("Missing Spartan or destination Supabase server-only environment variables.");
  const ownerId = process.env.SPARTAN_OWNER_USER_ID;
  if (!dryRun && !ownerId) throw new Error("SPARTAN_OWNER_USER_ID is required for an import.");
  const oldDb = createClient(oldUrl, oldKey, { auth: { persistSession: false } });
  const nextDb = createClient(nextUrl, nextKey, { auth: { persistSession: false } });
  const stableUuid = (value: string) => { const hex = createHash("sha256").update(`iballpassyou:spartan:${value}`).digest("hex").slice(0, 32).split(""); hex[12] = "4"; hex[16] = ["8", "9", "a", "b"][parseInt(hex[16], 16) % 4]; return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`; };
  async function rows<T>(table: string, columns = "*") { const { data, error } = await oldDb.from(table).select(columns); if (error) throw new Error(`Could not read predecessor ${table}: ${error.message}`); return (data ?? []) as T[]; }
  const players = await rows<OldPlayer>("players");
  const sessions = await rows<OldSession>("sessions");
  const stats = await rows<OldStat>("stats");
  const canonicalName = (name: string) => aliases[name.trim().toLocaleLowerCase()] ?? name.trim();
  const canonicalKey = (name: string) => canonicalName(name).toLocaleLowerCase();
  const playerByOldId = new Map(players.map((p) => [p.id, canonicalKey(p.name)]));
  const canonicalPlayers = [...new Map(players.map((p) => [canonicalKey(p.name), canonicalName(p.name)])).entries()];
  const groupId = stableUuid("group");
  const aggregated = new Map<string, { group_id: string; session_id: string; player_id: string; session_team_id: null; goals: number; assists: number }>();
  for (const stat of stats) { const key = playerByOldId.get(stat.player_id); if (!key) throw new Error(`Stat references unknown player ${stat.player_id}`); const aggregateKey = `${stat.session_id}:${key}`; const prior = aggregated.get(aggregateKey) ?? { group_id: groupId, session_id: stableUuid(`session:${stat.session_id}`), player_id: stableUuid(`player:${key}`), session_team_id: null, goals: 0, assists: 0 }; prior.goals += Number(stat.goals) || 0; prior.assists += Number(stat.assists) || 0; aggregated.set(aggregateKey, prior); }
  const appearances = [...aggregated.values()];
  const report = { sourcePlayers: players.length, players: canonicalPlayers.length, sessions: sessions.length, appearances: appearances.length, goals: appearances.reduce((n, s) => n + s.goals, 0), assists: appearances.reduce((n, s) => n + s.assists, 0) };
  console.log(`${dryRun ? "DRY RUN" : "IMPORT"} · Spartan`); console.table(report);
  if (dryRun) { console.log("No destination writes performed."); return; }
  const visibility = process.env.SPARTAN_GROUP_VISIBILITY === "public" ? "public" : "private";
  let result = await nextDb.from("groups").upsert({ id: groupId, name: "Spartan", timezone: "Africa/Lagos", default_session_format: "fixed_teams", visibility, public_slug: visibility === "public" ? "spartan" : null }, { onConflict: "id" }); if (result.error) throw result.error;
  result = await nextDb.from("group_members").upsert({ group_id: groupId, user_id: ownerId, role: "owner" }, { onConflict: "group_id,user_id" }); if (result.error) throw result.error;
  result = await nextDb.from("group_schedules").upsert({ id: stableUuid("schedule:tuesday"), group_id: groupId, day_of_week: 2, kickoff_time: "17:30", venue: process.env.SPARTAN_VENUE ?? null, active: true }, { onConflict: "id" }); if (result.error) throw result.error;
  const newPlayers = canonicalPlayers.map(([key, name]) => ({ id: stableUuid(`player:${key}`), group_id: groupId, name, active: true })); if (newPlayers.length) { result = await nextDb.from("players").upsert(newPlayers, { onConflict: "id" }); if (result.error) throw result.error; }
  const newSessions = sessions.map((s) => ({ id: stableUuid(`session:${s.id}`), group_id: groupId, kickoff_at: `${s.session_date}T17:30:00+01:00`, format: "fixed_teams", client_session_id: stableUuid(`client-session:${s.id}`) })); if (newSessions.length) { result = await nextDb.from("sessions").upsert(newSessions, { onConflict: "group_id,client_session_id" }); if (result.error) throw result.error; }
  if (appearances.length) { result = await nextDb.from("session_players").upsert(appearances, { onConflict: "session_id,player_id" }); if (result.error) throw result.error; }
  const [{ count: playerCount }, { count: sessionCount }, { data: reconciled, error: reconcileError }] = await Promise.all([nextDb.from("players").select("id", { count: "exact", head: true }).eq("group_id", groupId), nextDb.from("sessions").select("id", { count: "exact", head: true }).eq("group_id", groupId), nextDb.from("session_players").select("goals,assists").eq("group_id", groupId)]); if (reconcileError) throw reconcileError;
  const actual = { players: playerCount ?? 0, sessions: sessionCount ?? 0, appearances: reconciled?.length ?? 0, goals: (reconciled ?? []).reduce((n, s) => n + s.goals, 0), assists: (reconciled ?? []).reduce((n, s) => n + s.assists, 0) }; console.table({ source: report, destination: actual });
  for (const key of ["players", "sessions", "appearances", "goals", "assists"] as const) if (report[key] !== actual[key]) throw new Error(`Reconciliation failed for ${key}: ${report[key]} != ${actual[key]}`);
  console.log("Reconciliation passed. Re-running is safe.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
