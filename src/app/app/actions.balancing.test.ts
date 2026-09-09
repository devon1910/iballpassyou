import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { saveSessionAction, saveBalancingProfileAction, type SessionActionInput } from "./actions";

const groupId = "11111111-1111-4111-8111-111111111111";
const playerId = "22222222-2222-4222-8222-222222222222";
const profile = { primaryPosition: "defender" as const, secondaryPosition: null, keeperCapable: true, skillLevel: 4 };
const input: SessionActionInput = {
  group_id: groupId, client_session_id: "33333333-3333-4333-8333-333333333333", date: "2020-01-01", time: "18:00", timezone: "Africa/Lagos", format: "fixed_teams",
  teams: [{ client_key: "0", label: "Red", set_wins: 1 }, { client_key: "1", label: "Black", set_wins: 0 }],
  players: [{ player_id: playerId, team_key: "0", goals: 2, assists: 1 }, { name: "New attendee", team_key: "1", goals: 0, assists: 0, balancing: profile }],
};
beforeEach(() => vi.resetAllMocks());
it("sends accepted assignments and new-player metadata through the existing session RPC", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: input.client_session_id, error: null });
  vi.mocked(createClient).mockResolvedValue({ rpc } as unknown as Awaited<ReturnType<typeof createClient>>);
  expect(await saveSessionAction(input)).toEqual({ ok: true, id: input.client_session_id, demo: false });
  expect(rpc).toHaveBeenCalledWith("save_session", { command: expect.objectContaining({ teams: input.teams, players: input.players, format: "fixed_teams" }) });
});
it("rejects invalid Skill Level before any database request", async () => {
  const result = await saveBalancingProfileAction(groupId, playerId, { ...profile, skillLevel: 6 });
  expect(result.ok).toBe(false);
  expect(createClient).not.toHaveBeenCalled();
  expect((await saveSessionAction({ ...input, players: [{ ...input.players[1], balancing: { ...profile, skillLevel: 0 } }] })).ok).toBe(false);
  expect(createClient).not.toHaveBeenCalled();
});
it("does not require balancing metadata for manual session saves", async () => {
  vi.mocked(createClient).mockResolvedValue(null);
  const players = input.players.map(player => ({ ...player }));
  for (const player of players) delete player.balancing;
  const manual = { ...input, players };
  expect((await saveSessionAction(manual)).ok).toBe(true);
});
