import { describe, expect, it } from "vitest";
import { monthlyMvps, playerHonours, sessionMotm, sessionRecord } from "./achievements";
import type { FootballSession, Group } from "@/types/domain";

function session(id: string, date: string, goals = 1, format: FootballSession["format"] = "none"): FootballSession {
  return { id, clientSessionId: id, kickoffAt: date, format, teams: [], appearances: [{ playerId: "a", playerName: "Ada", goals, assists: 0 }] };
}
function group(sessions: FootballSession[]): Group {
  return { id: "g", name: "Ballers", timezone: "Africa/Lagos", defaultSessionFormat: "none", visibility: "private", shareToken: "", schedules: [], players: [{ id: "a", name: "Ada", active: true }], sessions };
}
const now = new Date("2026-09-09T12:00:00Z");

describe("honours", () => {
  it("shares tied MOTM awards, includes the win bonus, and skips zero scores", () => {
    const s = session("s", "2026-08-01T12:00:00Z");
    s.appearances.push({ playerId: "b", playerName: "Ben", goals: 0, assists: 2 });
    expect(sessionMotm(s).map(w => w.playerId)).toEqual(["a", "b"]);
    s.format = "sets";
    s.teams = [{ id: "t", label: "Winners", setWins: 3 }];
    s.appearances[1].teamId = "t";
    expect(sessionMotm(s).map(w => w.playerId)).toEqual(["b"]);
    expect(sessionMotm(session("zero", s.kickoffAt, 0))).toEqual([]);
  });
  it("awards only closed local months, including the year boundary", () => {
    const g = group([session("aug", "2026-08-31T22:59:00Z"), session("sep", "2026-08-31T23:00:00Z", 10)]);
    expect(monthlyMvps(g, now).map(m => [m.month, m.winners[0].rating])).toEqual([["2026-08", 4]]);
    expect(monthlyMvps(group([session("dec", "2025-12-31T22:00:00Z")]), new Date("2025-12-31T23:01:00Z"))[0].month).toBe("2025-12");
  });
  it("shares monthly ties using the whole month's totals", () => {
    const s = session("one", "2026-08-01T12:00:00Z");
    s.appearances.push({ playerId: "b", playerName: "Ben", goals: 2, assists: 0 });
    const g = group([s, session("two", "2026-08-02T12:00:00Z")]);
    expect(monthlyMvps(g, now)[0].winners.map(w => w.playerId)).toEqual(["a", "b"]);
    expect(playerHonours(g, "a", now).mvp).toHaveLength(1);
  });
});

describe("personal bests", () => {
  const first = session("first", "2026-08-01T12:00:00Z", 0);
  const record = session("record", "2026-08-02T12:00:00Z", 3);
  const tied = session("tied", "2026-08-03T12:00:00Z", 3);
  const lower = session("lower", "2026-08-04T12:00:00Z", 1);
  const other = session("other", "2026-08-05T12:00:00Z", 5, "sets");
  it("distinguishes benchmarks, broken records, ties and lower scores regardless of input order", () => {
    const g = group([other, tied, lower, record, first]);
    expect(sessionRecord(g, first, "a")?.kind).toBe("baseline");
    expect(sessionRecord(g, record, "a")).toMatchObject({ kind: "broken", points: 12, previousBest: 0 });
    expect(sessionRecord(g, tied, "a")?.kind).toBe("matched");
    expect(sessionRecord(g, lower, "a")?.kind).toBeUndefined();
    expect(sessionRecord(g, other, "a")?.kind).toBe("baseline");
    expect(playerHonours(g, "a", now).bests.map(b => b.session.id)).toEqual(["record", "other"]);
    expect(sessionRecord(g, first, "missing")).toBeUndefined();
  });
  it("recalculates after corrections, backfills and deletions", () => {
    const g = group([first, record, lower]);
    expect(playerHonours(g, "a", now).bests[0].points).toBe(12);
    g.sessions = [first, lower];
    expect(playerHonours(g, "a", now).bests[0].points).toBe(4);
    g.sessions.push(session("backfill", "2026-07-01T12:00:00Z", 6));
    expect(sessionRecord(g, lower, "a")?.kind).toBeUndefined();
    expect(playerHonours(g, "a", now).bests[0].points).toBe(24);
    g.sessions[2] = session("backfill", "2026-07-01T12:00:00Z", 0);
    expect(playerHonours(g, "a", now).bests[0].points).toBe(4);
  });
  it("has no fabricated awards or records for a player with no sessions", () => {
    expect(playerHonours(group([]), "a", now)).toEqual({ motm: [], mvp: [], bests: [] });
  });
});
