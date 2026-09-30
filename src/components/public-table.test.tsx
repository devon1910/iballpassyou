import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicTable } from "./public-table";
import type { Group } from "@/types/domain";

const group: Group = {
  id: "group-1", name: "Ballers", timezone: "Africa/Lagos", defaultSessionFormat: "none",
  visibility: "public", publicSlug: "ballers", shareToken: "", schedules: [],
  players: [{ id: "a", name: "Ada", active: true }, { id: "b", name: "Bola", active: true }],
  sessions: [{
    id: "aug-1", clientSessionId: "aug-1", kickoffAt: "2026-08-15T16:00:00Z", format: "none", teams: [],
    appearances: [
      { playerId: "a", playerName: "Ada", goals: 1, assists: 0 },
      { playerId: "b", playerName: "Bola", goals: 0, assists: 2 },
    ],
  }],
};

describe("Player of the Month card", () => {
  afterEach(() => vi.useRealTimers());

  it("shows the completed month's tied winners and a receipt share action", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    const html = renderToStaticMarkup(<PublicTable group={group} period="last_month" base="/groups/ballers" playerBase="/groups/ballers/players" />);
    expect(html).toContain("Player of the Month achievement");
    expect(html).toContain("Ada / Bola");
    expect(html).toContain("JOINT WINNERS");
    expect(html).toContain("TOTAL POINTS");
    expect(html).toContain("Goals</dt><dd>1</dd>");
    expect(html).toContain("Assists</dt><dd>2</dd>");
    expect(html).toContain("Wins</dt><dd>0</dd>");
    expect(html).toContain("Share Player of the Month");
    expect(html).toContain("/groups/ballers?period=last_month");
  });

  it("keeps the previous month's award off This month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    const current = renderToStaticMarkup(<PublicTable group={group} period="month" base="/groups/ballers" playerBase="/groups/ballers/players" />);
    expect(current).not.toContain("Player of the Month achievement");
    expect(current).not.toContain("Share Player of the Month");
  });

  it("does not announce a zero-score month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    const zeroGroup = { ...group, sessions: [{ ...group.sessions[0], appearances: [{ playerId: "a", playerName: "Ada", goals: 0, assists: 0 }] }] };
    const zero = renderToStaticMarkup(<PublicTable group={zeroGroup} period="last_month" base="/groups/ballers" playerBase="/groups/ballers/players" />);
    expect(zero).not.toContain("Player of the Month achievement");
  });
});
