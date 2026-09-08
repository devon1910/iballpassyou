import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayerDetail } from "./player-detail";
import type { FootballSession, Group } from "@/types/domain";

const playerId = "player-1";

function session(id: string, kickoffAt: string): FootballSession {
  return {
    id,
    clientSessionId: id,
    kickoffAt,
    format: "none",
    teams: [],
    appearances: [{ playerId, playerName: "Ada", goals: 0, assists: 0 }],
  };
}

describe("PlayerDetail", () => {
  it("shows the player's complete migrated session history", () => {
    const group: Group = {
      id: "group-1",
      name: "Spartan",
      timezone: "Africa/Lagos",
      defaultSessionFormat: "none",
      visibility: "public",
      shareToken: "",
      schedules: [],
      players: [{ id: playerId, name: "Ada", active: true }],
      sessions: [
        session("apr", "2026-04-21T16:30:00.000Z"),
        ...Array.from({ length: 8 }, (_, index) => session(`later-${index}`, `2026-07-${String(index + 1).padStart(2, "0")}T16:30:00.000Z`)),
      ],
    };

    const markup = renderToStaticMarkup(<PlayerDetail group={group} playerId={playerId} backHref="/groups/spartan" />);

    expect(markup).toContain("Session history");
    expect(markup).toContain("21 Apr");
  });
});
